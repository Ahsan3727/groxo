const User = require('../models/User');
const generateToken = require('../utils/generateToken');

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
  const admin = await User.findById(req.admin._id).select('-password');
  res.json(admin);
};

// Dashboard stats
exports.dashboard = async (req, res) => {
  // Add your own stats logic or a placeholder
  res.json({ message: 'Dashboard data' });
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
    res.json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};