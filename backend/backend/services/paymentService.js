// Payment Service (Stripe placeholder)
const processPayment = async (amount, currency, source) => {
  // TODO: integrate Stripe
  return { success: true, transactionId: 'stripe_txn_' + Date.now() };
};
module.exports = { processPayment };
