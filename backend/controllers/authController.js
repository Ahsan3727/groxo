const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, phone, password, role: role || 'customer' });
    // If the user provided address coordinates, store them as currentLocation
if (req.body.address) {
  const { street, city, state, zip, lat, lng } = req.body.address;
  if (street || city || state || zip) {
    user.address = { street, city, state, zip };
  }
  if (lat && lng) {
    user.currentLocation = {
      type: 'Point',
      coordinates: [lng, lat],
    };
    user.lastLocationUpdate = new Date();
  }
  await user.save();
}
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const user = await User.findOne({ $or: [{ email: email || '' }, { phone: phone || '' }] });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Update current user profile
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, vehicle, address } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (vehicle) user.vehicle = vehicle;
    if (address) user.address = { ...(user.address ? user.address.toObject?.() ?? user.address : {}), ...address };

    const updated = await user.save();
    const response = updated.toObject();
    delete response.password;
    res.json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};