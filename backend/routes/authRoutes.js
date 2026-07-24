const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');

// Auth
router.post('/register', loginLimiter, register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

// Password recovery (no account needed to be logged in) — reuses the same
// strict rate limit as login/register since these are prime brute-force /
// enumeration targets (OTP guessing, account-existence probing).
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/reset-password', loginLimiter, resetPassword);

// Change password for an already-authenticated user (Settings screen).
router.put('/change-password', protect, changePassword);

// Push token (only one definition)
router.put('/push-token', protect, async (req, res) => {
  const { expoPushToken } = req.body;
  if (!expoPushToken) return res.status(400).json({ message: 'Token required' });
  try {
    const user = await User.findById(req.user._id);
    user.expoPushToken = expoPushToken;
    await user.save();
    res.json({ message: 'Push token saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Live location (real‑time tracking)
router.put('/location', protect, async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat and lng are required' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.currentLocation = { type: 'Point', coordinates: [lng, lat] };
    user.lastLocationUpdate = new Date();
    await user.save();

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;