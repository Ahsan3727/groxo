const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Order = require('../models/Order');

// ---------- WHOLESALER: Add product (automatically pending) ----------
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'wholesaler' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only wholesalers can add products' });
    }

    const { name, description, image, category, price, retailPrice, stock } = req.body;
    const product = await Product.create({
      name,
      description,
      image,
      category,
      price,
      retailPrice: retailPrice || 0,   // ← NEW
      wholesalerPrice: price,
      wholesaler: req.user._id,
      stock,
      status: 'pending',
      isApproved: false,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- WHOLESALER: Get their own products (all statuses) ----------
router.get('/my', protect, async (req, res) => {
  try {
    // Only wholesalers can access this endpoint
    if (req.user.role !== 'wholesaler' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const products = await Product.find({ wholesaler: req.user._id })
      .populate('wholesaler', 'storeName name')
      .sort({ createdAt: -1 });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- CUSTOMER: Get only approved products (public) ----------
router.get('/', async (req, res) => {
  try {
    const filter = { isApproved: true, status: 'approved' };
    if (req.query.category) filter.category = req.query.category;
    const products = await Product.find(filter).populate('wholesaler', 'storeName name');
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/popular
router.get('/popular', async (req, res) => {
  try {
    const popular = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $replaceRoot: { newRoot: '$product' } }
    ]);
    res.json({ products: popular });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;