const express = require('express');
const router = express.Router();
const { protect, protectAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { getWholesalerEarnings } = require('../utils/wholesalerEarnings');

// ---------- Earnings summary (single source of truth) ----------
// Both DashboardScreen.js and EarningsScreen.js previously reconstructed
// "revenue" client-side from raw GET /orders data using two different rules
// (all orders vs. delivered-only), which let their numbers drift apart for
// the same wholesaler/day. Both screens now call this instead.
// Must be registered before /:id so this literal path isn't swallowed by it.
router.get('/earnings-summary', protect, async (req, res) => {
  if (req.user.role !== 'wholesaler') {
    return res.status(403).json({ message: 'Wholesaler access only' });
  }
  try {
    const summary = await getWholesalerEarnings(req.user._id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Save shop location (must be before /:id) ----------
router.put('/location', protect, async (req, res) => {
  if (req.user.role !== 'wholesaler') {
    return res.status(403).json({ message: 'Only wholesalers can set shop location' });
  }

  const { lat, lng, address } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ message: 'Latitude and longitude are required' });
  }

  try {
    const user = await User.findById(req.user._id);
    user.shopLocation = {
      type: 'Point',
      coordinates: [lng, lat],
      address: address || '',
    };
    user.locationSet = true;
    await user.save();

    res.json({ message: 'Shop location saved', shopLocation: user.shopLocation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all wholesalers (admin only)
router.get('/', protectAdmin, async (req, res) => {
  try {
    const wholesalers = await User.find({ role: 'wholesaler' }).select('-password');
    res.json(wholesalers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single wholesaler (after /location, so this catches only ObjectIds)
router.get('/:id', protect, async (req, res) => {
  try {
    const wholesaler = await User.findOne({ _id: req.params.id, role: 'wholesaler' }).select('-password');
    if (!wholesaler) return res.status(404).json({ message: 'Wholesaler not found' });
    res.json(wholesaler);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update wholesaler (after /location, catches ObjectIds only)
router.put('/:id', protect, async (req, res) => {
  try {
    const wholesaler = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'wholesaler' },
      req.body,
      { new: true }
    ).select('-password');
    res.json(wholesaler);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;