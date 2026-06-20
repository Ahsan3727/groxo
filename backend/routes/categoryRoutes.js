const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Category = require('../models/Category');

// ─── ADMIN: Get all categories (global + per-wholesaler, for admin panel) ───
router.get('/admin', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const categories = await Category.find({}).sort('name');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── ADMIN: Create a global category ───
router.post('/admin', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Category name required' });
    const category = await Category.create({
      name: name.trim(),
      isGlobal: true,
    });
    res.status(201).json({ category });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Category already exists' });
    res.status(500).json({ message: error.message });
  }
});

// ─── ADMIN: Delete a global category ───
router.delete('/admin/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── WHOLESALER: Get all global categories (for AddProduct screen) ───
router.get('/global', protect, async (req, res) => {
  // Wholesaler or admin can fetch global categories
  if (req.user.role !== 'wholesaler' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  try {
    const categories = await Category.find({ isGlobal: true }).sort('name');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;