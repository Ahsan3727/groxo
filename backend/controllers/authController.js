// Inside controllers/authController.js (existing file, just verify)
const sendOTP = require('../utils/sendOTP');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/environment');

// Generate OTP and send
const generateAndSendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number required' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save user with OTP (upsert)
    await User.findOneAndUpdate(
      { phone },
      { phone, otp },
      { upsert: true, new: true }
    );

    // Send OTP (dev logs to console)
    await sendOTP(phone, otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// Verify OTP and return JWT
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Clear OTP after verification
    user.otp = undefined;
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ token, user: { id: user._id, phone: user.phone, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
};

module.exports = { generateAndSendOTP, verifyOTP };