const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Category = require('../models/Category');

// GET all categories for the logged-in wholesaler
router.get('/', protect, async (req, res) => {
  if (req.user.role !== 'wholesaler') {
    return res.status(403).json({ message: 'Only wholesalers can access' });
  }
  try {
    const categories = await Category.find({ wholesaler: req.user._id }).sort('name');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create a new category
router.post('/', protect, async (req, res) => {
  if (req.user.role !== 'wholesaler') {
    return res.status(403).json({ message: 'Only wholesalers can create categories' });
  }
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const category = await Category.create({
      name: name.trim(),
      wholesaler: req.user._id,
    });
    res.status(201).json({ category });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;