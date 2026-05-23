const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// PUT /api/rider/location
router.put('/location', protect, async (req, res) => {
  if (req.user.role !== 'rider') {
    return res.status(403).json({ message: 'Rider access only' });
  }

  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat and lng are required' });
  }

  try {
    const rider = await User.findById(req.user._id);
    rider.currentLocation = { type: 'Point', coordinates: [lng, lat] };
    rider.lastLocationUpdate = new Date();
    await rider.save();

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;