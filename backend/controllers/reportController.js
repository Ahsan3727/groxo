const Order = require('../models/Order');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ordersToday = await Order.countDocuments({ createdAt: { $gte: today } });
    const revenue = await Transaction.aggregate([
      { $match: { type: 'credit', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const activeRiders = await RiderLocation.countDocuments({ isOnline: true });
    res.json({ ordersToday, revenue: revenue[0]?.total || 0, activeRiders });
  } catch (err) {
    next(err);
  }
};

exports.getSalesReport = async (req, res, next) => {
  // Aggregations for sales
  res.json({ message: 'report endpoint' });
};
