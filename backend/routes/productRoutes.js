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
      retailPrice: retailPrice || 0,
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

// ---------- WHOLESALER: Update own product ----------
router.put('/:id', protect, async (req, res) => {
  try {
    // Only wholesalers can update products
    if (req.user.role !== 'wholesaler') {
      return res.status(403).json({ message: 'Only wholesalers can update products' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Verify ownership
    if (product.wholesaler.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own products' });
    }

    // Update allowed fields
    const { name, description, category, price, retailPrice, stock, unit, weight } = req.body;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (retailPrice !== undefined) product.retailPrice = retailPrice;
    if (stock !== undefined) product.stock = stock;
    if (unit !== undefined) product.unit = unit;
    if (weight !== undefined) product.weight = weight;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;