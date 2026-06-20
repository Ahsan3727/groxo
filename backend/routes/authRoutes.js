const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // <-- keep this one
const User = require('../models/User'); // needed for location update

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
// routes/authRoutes.js (or wherever your auth routes are)
// routes/authRoutes.js
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
// PUT /api/auth/location
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