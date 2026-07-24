const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Category = require('../models/Category');
const Product = require('../models/Product');

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

// ─── ADMIN: Rename a category ───
// PUT /categories/admin/:id
// Products store their category as a plain name string (not a ref), so
// renaming has to cascade to every product currently using the old name —
// otherwise the rename would silently orphan them, same as the delete bug
// this endpoint is paired with below.
router.put('/admin/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Category name required' });
    const newName = name.trim();

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const oldName = category.name;
    if (oldName === newName) return res.json({ category });

    const clash = await Category.findOne({
      _id: { $ne: category._id },
      name: newName,
      isGlobal: category.isGlobal,
    });
    if (clash) return res.status(400).json({ message: 'A category with that name already exists' });

    category.name = newName;
    await category.save();

    // Cascade the rename to every product still using the old name
    await Product.updateMany({ category: oldName }, { category: newName });

    res.json({ category });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'A category with that name already exists' });
    res.status(500).json({ message: error.message });
  }
});

// ─── ADMIN: Delete a global category ───
// Blocks the delete if any product still references it by name, instead of
// silently deleting the category out from under those products.
router.delete('/admin/:id', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product(s) still use "${category.name}". Rename or reassign them first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── WHOLESALER/CUSTOMER: Get all global categories ───
// Wholesalers use this for the AddProduct screen; customers use it to
// render the storefront category grid on HomeScreen (previously hardcoded
// client-side). Read-only, so any authenticated role can call it.
router.get('/global', protect, async (req, res) => {
  try {
    const categories = await Category.find({ isGlobal: true }).sort('name');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;