const Order = require('../models/Order');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// The wholesaler app previously computed "revenue" in two different places
// (DashboardScreen.js and EarningsScreen.js) with two different rules — one
// filtered to delivered orders only, the other summed every order
// regardless of status. This helper is the single place that math lives now,
// used by GET /wholesalers/earnings-summary and GET /payments/wallet alike.
//
// Rule: only orders where the wholesaler's group is fully delivered count
// as real, final revenue. "Delivered" is tracked at the parent Order level
// (order.status === 'delivered'); wholesalerGroups don't have their own
// terminal "delivered" state today, only 'packing' / 'ready_for_pickup', so
// we key off the parent order status, matching what Dashboard already did.
async function getWholesalerEarnings(wholesalerId) {
  const orders = await Order.find({
    $or: [
      { wholesaler: wholesalerId },
      { 'wholesalerGroups.wholesaler': wholesalerId },
    ],
  }).select('wholesalerGroups wholesaler payment status wholesalerPaid createdAt');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let today = 0;
  let week = 0;
  let month = 0;
  let allTime = 0;
  let received = 0; // delivered AND marked paid to the wholesaler
  let pending = 0;  // not yet delivered
  let deliveredOrderCount = 0;

  for (const order of orders) {
    // Figure out this wholesaler's slice of the order (group-based orders)
    // or the whole order (legacy single-wholesaler orders).
    let amount = 0;
    let isPaidToWholesaler = order.wholesalerPaid || false;

    if (order.wholesalerGroups && order.wholesalerGroups.length > 0) {
      const group = order.wholesalerGroups.find(
        (g) => g.wholesaler && g.wholesaler.toString() === wholesalerId.toString()
      );
      if (!group) continue;
      amount = group.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      isPaidToWholesaler = group.paid || false;
    } else if (order.wholesaler && order.wholesaler.toString() === wholesalerId.toString()) {
      amount = order.payment?.amount || 0;
    } else {
      continue;
    }

    if (order.status !== 'delivered') {
      pending += amount;
      continue;
    }

    deliveredOrderCount += 1;
    allTime += amount;
    const orderDate = new Date(order.createdAt);
    if (orderDate >= startOfToday) today += amount;
    if (orderDate >= startOfWeek) week += amount;
    if (orderDate >= startOfMonth) month += amount;
    if (isPaidToWholesaler) received += amount;
  }

  return {
    today,
    week,
    month,
    allTime,
    received,
    pending,
    deliveredOrderCount,
    avgOrderValue: deliveredOrderCount > 0 ? allTime / deliveredOrderCount : 0,
  };
}

// Wallet balance = everything delivered-and-marked-paid to the wholesaler,
// minus withdrawals already approved/paid out, minus withdrawals currently
// pending review (so a wholesaler can't request the same money twice while
// waiting on admin approval).
async function getWholesalerWalletBalance(wholesalerId) {
  const earnings = await getWholesalerEarnings(wholesalerId);

  const withdrawals = await WithdrawalRequest.find({
    user: wholesalerId,
    status: { $in: ['approved', 'paid', 'pending'] },
  });

  const withdrawn = withdrawals
    .filter((w) => w.status === 'approved' || w.status === 'paid')
    .reduce((sum, w) => sum + w.amount, 0);
  const pendingWithdrawals = withdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  const available = Math.max(0, earnings.received - withdrawn - pendingWithdrawals);

  return {
    balance: available,
    totalReceived: earnings.received,
    totalWithdrawn: withdrawn,
    pendingWithdrawals,
  };
}

module.exports = { getWholesalerEarnings, getWholesalerWalletBalance };
