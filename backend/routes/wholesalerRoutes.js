const express = require('express');
const router = express.Router();
const { protect, protectAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get all wholesalers (admin only)
router.get('/', protectAdmin, async (req, res) => {
  try {
    const wholesalers = await User.find({ role: 'wholesaler' }).select('-password');
    res.json(wholesalers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single wholesaler
router.get('/:id', protect, async (req, res) => {
  try {
    const wholesaler = await User.findOne({ _id: req.params.id, role: 'wholesaler' }).select('-password');
    if (!wholesaler) return res.status(404).json({ message: 'Wholesaler not found' });
    res.json(wholesaler);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update wholesaler
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