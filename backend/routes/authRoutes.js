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