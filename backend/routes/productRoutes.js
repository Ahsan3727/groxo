const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const Order = require('../models/Order');
const cloudinary = require('../config/cloudinary');

// ---------- Multer config for wholesaler product-image uploads ----------
// Mirrors the pattern already used in adminRoutes.js for /admin/products/:id/image
// and /admin/banners/upload-image — temp local file, then pushed to Cloudinary.
const productUploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true });
}
const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: productUploadsDir,
    filename: (req, file, cb) => cb(null, `wholesaler-${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only image files (jpg, png, webp) are allowed'), ok);
  },
}).single('productImage');

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
// Excludes soft-deleted (isActive: false) products so "Delete Product"
// actually makes a product disappear from the wholesaler's own inventory.
router.get('/my', protect, async (req, res) => {
  try {
    if (req.user.role !== 'wholesaler' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const products = await Product.find({ wholesaler: req.user._id, isActive: { $ne: false } })
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
    const filter = { isApproved: true, status: 'approved', isActive: { $ne: false } };
    if (req.query.category) filter.category = req.query.category;
    const products = await Product.find(filter).populate('wholesaler', 'storeName name');
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- WHOLESALER: Upload/replace a product photo ----------
// POST /api/products/upload-image  (multipart/form-data, field name "productImage")
// Returns a hosted Cloudinary URL — call this BEFORE creating/updating the
// product, then send the returned url as the product's `image` field.
// Registered before /:id so this literal path isn't swallowed by it.
router.post('/upload-image', protect, (req, res) => {
  if (req.user.role !== 'wholesaler' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only wholesalers can upload product images' });
  }
  productImageUpload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image selected' });
    }
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'groxo-products',
        use_filename: true,
        unique_filename: true,
      });
      fs.unlinkSync(req.file.path);
      res.json({ image: result.secure_url });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({ message: 'Image upload failed' });
    }
  });
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
    const { name, description, category, price, retailPrice, stock, unit, weight, image } = req.body;
    let changed = false;
    if (name !== undefined && name !== product.name) { product.name = name; changed = true; }
    if (description !== undefined && description !== product.description) { product.description = description; changed = true; }
    if (category !== undefined && category !== product.category) { product.category = category; changed = true; }
    if (price !== undefined && price !== product.price) { product.price = price; product.wholesalerPrice = price; changed = true; }
    if (retailPrice !== undefined && retailPrice !== product.retailPrice) { product.retailPrice = retailPrice; changed = true; }
    if (stock !== undefined && stock !== product.stock) { product.stock = stock; changed = true; }
    if (unit !== undefined && unit !== product.unit) { product.unit = unit; changed = true; }
    if (weight !== undefined && weight !== product.weight) { product.weight = weight; changed = true; }
    // Product image, previously never editable from here — AddProductScreen/
    // ProductManagementScreen now upload via POST /products/upload-image
    // first, then send the returned URL as `image`.
    if (image !== undefined && image !== product.image) { product.image = image; changed = true; }

    // A rejected product edited by the wholesaler was previously stuck at
    // status: 'rejected' forever with no way to get re-reviewed. Now any
    // real change resubmits it for admin review.
    if (product.status === 'rejected' && changed) {
      product.status = 'pending';
      product.isApproved = false;
      product.rejectionReason = '';
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- WHOLESALER: Delete own product (soft delete) ----------
// A hard delete would leave historical orders' `items`/`wholesalerGroups`
// pointing at a product document that no longer exists, breaking
// OrderDetailScreen's `item.product?.name` lookups for past orders. So this
// sets isActive: false instead — the product disappears from the
// wholesaler's inventory and the public catalog, but old order line items
// still resolve correctly.
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (req.user.role !== 'admin' && product.wholesaler.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own products' });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;