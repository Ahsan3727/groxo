const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');

// ---------- WHOLESALER: Add product (automatically pending) ----------
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'wholesaler' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only wholesalers can add products' });
    }

    const { name, description, image, category, price, stock } = req.body;
    const product = await Product.create({
      name,
      description,
      image,
      category,
      price,                  // wholesaler sets this
      wholesalerPrice: price, // original price for admin reference
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

// ---------- CUSTOMER: Get only approved products ----------
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

module.exports = router;