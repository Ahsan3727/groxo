const User = require('../models/User');
const { generateOTP } = require('../utils/otpHelper');
const { sendSMS } = require('../services/smsService');

exports.register = async (req, res, next) => {
  try {
    const { phone, password, role, name, email } = req.body;
    // Check if user exists
    let user = await User.findOne({ phone });
    if (user) return res.status(400).json({ message: 'Phone already registered' });

    user = new User({ phone, password, role, name, email });
    await user.save();

    // Send OTP (dummy)
    const otp = generateOTP();
    await sendSMS(phone, `Your Groxo OTP is: ${otp}`);
    // In production, store OTP in cache

    const token = user.generateAuthToken();
    res.status(201).json({ success: true, token, user: { id: user._id, phone, role } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = user.generateAuthToken();
    res.json({ success: true, token, user: { id: user._id, phone, role: user.role } });
  } catch (err) {
    next(err);
  }
};

exports.verifyOTP = async (req, res, next) => {
  // Dummy OTP verification – in production check cache
  res.json({ success: true, message: 'OTP verified' });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};
