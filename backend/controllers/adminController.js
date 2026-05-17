const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

exports.dashboard = async (req, res) => {
  try {
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: new Date().setHours(0,0,0,0) } });
    const revenue = await Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: new Date().setHours(0,0,0,0) } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const activeRiders = await User.countDocuments({ role: 'rider', isActive: true });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const chartData = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
      { $limit: 7 },
      { $project: { date: '$_id', revenue: 1, _id: 0 } }
    ]);
    res.json({ stats: { todayOrders, revenue: revenue[0]?.total || 0, activeRiders, pendingOrders }, chartData });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');
    res.json({ users });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action } = req.body;
    const isActive = action === 'unban';
    const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
    res.json({ user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter).populate('customer', 'name phone').sort('-createdAt');
    res.json({ orders });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    res.json({ order });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'pending' }).populate('wholesaler', 'name');
    res.json({ products });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.approveProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { action } = req.body;
    const status = action === 'approve' ? 'approved' : 'rejected';
    const product = await Product.findByIdAndUpdate(productId, { status }, { new: true });
    res.json({ product });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTransactions = (req, res) => res.json({ transactions: [] });
exports.handleWithdrawal = (req, res) => res.json({ success: true });
exports.salesReport = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
      { $project: { period: '$_id', revenue: 1, _id: 0 } }
    ]);
    res.json({ data });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
exports.riderPerformance = (req, res) => res.json({ data: [] });
exports.updateGeneralSettings = (req, res) => res.json({ success: true });
exports.updateCommission = (req, res) => res.json({ success: true });
exports.getTickets = (req, res) => res.json({ tickets: [] });
exports.resolveTicket = (req, res) => res.json({ success: true });

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@groxo.com' && password === 'admin123') {
    res.json({ token: 'dummy-admin-jwt-token', admin: { name: 'Super Admin', role: 'admin' } });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};
exports.me = (req, res) => res.json({ admin: { name: 'Super Admin', role: 'admin' } });
