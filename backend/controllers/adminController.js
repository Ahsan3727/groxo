const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const AdminAuditLog = require('../models/AdminAuditLog');
const generateToken = require('../utils/generateToken');

// Fire-and-forget audit log write — never let a logging failure block or
// fail the admin action that triggered it.
const logAdminAction = (adminId, action, targetType, targetId, details) => {
  AdminAuditLog.create({ admin: adminId, action, targetType, targetId, details }).catch((err) =>
    console.error('Audit log write failed:', err.message)
  );
};

// Admin login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const admin = await User.findOne({ email, role: 'admin' });
  if (admin && (await admin.comparePassword(password))) {
    res.json({
      _id: admin._id, name: admin.name, email: admin.email, role: admin.role,
      token: generateToken(admin._id)
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
};

// Get current admin
exports.me = async (req, res) => {
  const admin = await User.findById(req.user._id).select('-password');
  res.json(admin);
};

// Dashboard stats
exports.dashboard = async (req, res) => {
  try {
    // Users, broken down by role (customers/riders/wholesalers — admins excluded)
    const roleCounts = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const usersByRole = roleCounts.reduce((acc, r) => {
      acc[r._id] = r.count;
      return acc;
    }, {});
    const totalUsers = roleCounts.reduce((sum, r) => sum + r.count, 0);

    // Every order ever placed
    const totalOrders = await Order.countDocuments();

    // Revenue = sum of order payments that actually completed — either the
    // order was delivered (COD collected) or it was paid online.
    const revenueAgg = await Order.aggregate([
      { $match: { $or: [{ status: 'delivered' }, { 'payment.status': 'paid' }] } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({ totalUsers, totalOrders, totalRevenue, usersByRole });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Settings ----------
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ appName: settings.appName, commission: settings.commission });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateGeneralSettings = async (req, res) => {
  try {
    const { appName } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (appName !== undefined) settings.appName = appName;
    await settings.save();
    res.json({ appName: settings.appName, commission: settings.commission });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCommissionSettings = async (req, res) => {
  try {
    const { commission } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (commission !== undefined) settings.commission = commission;
    await settings.save();
    res.json({ appName: settings.appName, commission: settings.commission });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all users with optional role filter
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new user (any role)
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, address, vehicle, storeName, businessLicense } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const userData = { name, email, phone, password, role: role || 'customer' };
    if (role === 'customer' && address) userData.address = address;
    if (role === 'rider' && vehicle) userData.vehicle = vehicle;
    if (role === 'wholesaler') {
      if (storeName) userData.storeName = storeName;
      if (businessLicense) userData.businessLicense = businessLicense;
    }

    const user = await User.create(userData);
    const response = user.toObject();
    delete response.password;
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, phone, role, isActive, address, vehicle, storeName, businessLicense } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    if (role === 'customer' && address) user.address = address;
    if (role === 'rider' && vehicle) user.vehicle = vehicle;
    if (role === 'wholesaler') {
      if (storeName !== undefined) user.storeName = storeName;
      if (businessLicense !== undefined) user.businessLicense = businessLicense;
    }

    const updated = await user.save();
    const response = updated.toObject();
    delete response.password;

    logAdminAction(req.user._id, 'user.update', 'User', user._id, req.body);

    res.json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete user
//
// Previously this hard-deleted with no referential-integrity check at all:
// deleting a wholesaler orphaned their products (dangling `wholesaler` ref),
// and deleting a rider orphaned any order that referenced them. This now
// blocks the delete when dependent records exist. To remove a wholesaler/
// rider anyway, either reassign/clear their dependent records first, or
// deactivate them instead (PUT /admin/users/:id with isActive: false) —
// deactivation was already supported, it just wasn't the guided path.
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'wholesaler') {
      const productCount = await Product.countDocuments({ wholesaler: user._id });
      if (productCount > 0) {
        return res.status(400).json({
          message: `Cannot delete: this wholesaler has ${productCount} product(s) listed. Deactivate the account instead (isActive: false), or remove/reassign their products first.`,
        });
      }
    }

    if (user.role === 'rider') {
      const activeOrderCount = await Order.countDocuments({
        rider: user._id,
        status: { $nin: ['delivered', 'cancelled'] },
      });
      if (activeOrderCount > 0) {
        return res.status(400).json({
          message: `Cannot delete: this rider has ${activeOrderCount} active order(s) assigned. Reassign or complete them first, or deactivate the account instead.`,
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    logAdminAction(req.user._id, 'user.delete', 'User', user._id, {
      deletedRole: user.role,
      deletedEmail: user.email,
    });

    res.json({ message: 'User removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};