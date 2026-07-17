const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary'); // ✅ Cloudinary import
const {
  login,
  me,
  dashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getSettings,
  updateGeneralSettings,
  updateCommissionSettings,
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const SupportTicket = require('../models/SupportTicket');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
 
// ---------- Multer configuration (absolute path + auto-create) ----------
const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
 
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
 
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single('productImage');
 
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}
 
// ---------- Auth / Admin info ----------
router.post('/login', login);
router.get('/me', protectAdmin, me);
router.get('/dashboard', protectAdmin, dashboard);

// ---------- Settings ----------
router.get('/settings', protectAdmin, getSettings);
router.put('/settings/general', protectAdmin, updateGeneralSettings);
router.put('/settings/commission', protectAdmin, updateCommissionSettings);
 
// ---------- User Management ----------
router.get('/users', protectAdmin, getUsers);
router.post('/users', protectAdmin, createUser);
router.put('/users/:id', protectAdmin, updateUser);
router.delete('/users/:id', protectAdmin, deleteUser);
 
// ---------- Location Endpoints (for HubMap) ----------
 
// Riders
router.get('/riders/locations', protectAdmin, async (req, res) => {
  try {
    const riders = await User.find({ role: 'rider' }).select('-password');
    const data = riders.map(r => ({
      _id: r._id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      isActive: r.isActive,
      vehicle: r.vehicle,
      currentLocation: r.currentLocation
        ? { lat: r.currentLocation.coordinates[1], lng: r.currentLocation.coordinates[0] }
        : null,
      lastLocationUpdate: r.lastLocationUpdate,
      status: r.isActive ? 'online' : 'offline',
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// Customers
router.get('/customers/locations', protectAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    const data = customers.map(c => {
      let loc = null;
      if (c.currentLocation && c.currentLocation.coordinates && c.currentLocation.coordinates.length === 2) {
        loc = {
          lat: c.currentLocation.coordinates[1],
          lng: c.currentLocation.coordinates[0],
        };
      } else if (c.address && c.address.lat && c.address.lng) {
        loc = {
          lat: c.address.lat,
          lng: c.address.lng,
        };
      }
      return {
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isActive: c.isActive,
        address: c.address,
        currentLocation: loc,
        lastLocationUpdate: c.lastLocationUpdate,
        status: 'customer',
      };
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// Wholesalers – returns saved shopLocation (permanent) and falls back to live location
router.get('/wholesalers/locations', protectAdmin, async (req, res) => {
  try {
    const wholesalers = await User.find({ role: 'wholesaler' }).select('-password');
    const data = wholesalers.map(w => {
      let location = null;
 
      // Saved shop location – use only if it's not the default [0,0]
      const shop = w.shopLocation;
      if (shop && shop.coordinates && shop.coordinates.length === 2) {
        const [lng, lat] = shop.coordinates;
        if (lat !== 0 || lng !== 0) {           // ← skip if zeros
          location = {
            lat,
            lng,
            address: shop.address || '',
          };
        }
      }
 
      // Fallback to live GPS if no valid saved location
      if (!location && w.currentLocation && w.currentLocation.coordinates && w.currentLocation.coordinates.length === 2) {
        const [lng, lat] = w.currentLocation.coordinates;
        if (lat !== 0 || lng !== 0) {
          location = { lat, lng };
        }
      }
 
      return {
        _id: w._id,
        name: w.name,
        email: w.email,
        phone: w.phone,
        storeName: w.storeName,
        businessLicense: w.businessLicense,
        isActive: w.isActive,
        shopLocation: w.shopLocation,
        currentLocation: location,        // the one to show on the map
        lastLocationUpdate: w.lastLocationUpdate,
        status: 'wholesaler',
      };
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Product Approval ----------
router.get('/products/pending', protectAdmin, async (req, res) => {
  try {
    const products = await Product.find({ status: 'pending' })
      .populate('wholesaler', 'storeName name email');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Product Catalog ----------
// GET /api/admin/products – all products with details
router.get('/products', protectAdmin, async (req, res) => {
  try {
    const products = await Product.find({})
      .populate('wholesaler', 'storeName name email')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- IMAGE UPLOAD – Cloudinary powered, permanent storage ----------
router.put('/products/:id/image', protectAdmin, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file selected' });
    }
 
    
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'groxo-products',
        use_filename: true,
        unique_filename: true,
      });
 
      // Delete the temporary local file
      fs.unlinkSync(req.file.path);
 
      // Update the product with the permanent Cloudinary URL
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
 
      product.image = result.secure_url;
      await product.save();
 
      console.log('Image uploaded to Cloudinary:', product.image);
      res.json({ message: 'Image uploaded', image: product.image });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500).json({ message: 'Image upload failed' });
    }
  });
});
 
// ---------- Generic product update – now AFTER the image route ----------
// PUT /api/admin/products/:id
// Accepts any subset of the product's editable fields so the admin catalog
// page can update name, price and every other product detail in one call.
router.put('/products/:id', protectAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      unit,
      weight,
      price,            // wholesaler's submitted / base price
      wholesalerPrice,  // kept in sync with `price` for older records
      adminPrice,       // final price the platform sells at
      retailPrice,      // suggested retail price
      stock,
      lowStockThreshold,
      isActive,
      status,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (unit !== undefined) product.unit = unit;
    if (weight !== undefined) product.weight = weight;
    if (price != null) product.price = price;
    if (wholesalerPrice != null) product.wholesalerPrice = wholesalerPrice;
    if (adminPrice != null) product.adminPrice = adminPrice;
    if (retailPrice != null) product.retailPrice = retailPrice;
    if (stock != null) product.stock = stock;
    if (lowStockThreshold != null) product.lowStockThreshold = lowStockThreshold;
    if (isActive !== undefined) product.isActive = isActive;
    if (status) {
      product.status = status;
      product.isApproved = status === 'approved';
    }

    await product.save();
    await product.populate('wholesaler', 'storeName name email');
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Delete a product ----------
// DELETE /api/admin/products/:id
router.delete('/products/:id', protectAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Order Management ----------
router.get('/orders', protectAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('wholesaler', 'name storeName')
      .populate('wholesalerGroups.wholesaler', 'name storeName')
      .populate('rider', 'name phone vehicle')
      .populate('items.product', 'name price')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/orders/settle-all   – mark all unsettled COD orders as settled
router.put('/orders/settle-all', protectAdmin, async (req, res) => {
  try {
    const { riderId } = req.body;   // optional – settle only for this rider
 
    const filter = {
      'payment.method': 'cod',
      riderSettled: false,
      status: 'delivered',
    };
    if (riderId) filter.rider = riderId;
 
    const result = await Order.updateMany(filter, { riderSettled: true });
 
    res.json({
      message: `Settled ${result.modifiedCount} orders`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/orders/:id  (update order status / assign rider)
router.put('/orders/:id', protectAdmin, async (req, res) => {
  try {
    const { status, rider } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
 
    if (status) order.status = status;
    if (rider) order.rider = rider;
 
    order.timeline.push({
      status: status || order.status,
      timestamp: new Date(),
      note: `Admin updated to ${status || order.status}`,
    });
 
    await order.save();
    await order.populate(['customer', 'wholesaler', 'wholesalerGroups.wholesaler','wholesalerGroups.items.product',  'rider', 'items.product']);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/orders/:id/settle  – mark rider as settled (old single order)
router.put('/orders/:id/settle', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
 
    order.riderSettled = true;
    await order.save();
 
    res.json({ message: 'Rider marked as settled', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/orders/:orderId/pay-wholesaler-group  – pay a specific group (new)
router.put('/orders/:orderId/pay-wholesaler-group', protectAdmin, async (req, res) => {
  try {
    const { groupIndex } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (groupIndex < 0 || groupIndex >= order.wholesalerGroups.length) {
      return res.status(400).json({ message: 'Invalid group index' });
    }
 
    order.wholesalerGroups[groupIndex].paid = true;
    await order.save();
    res.json({ message: 'Wholesaler marked as paid', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Riders list (for order assignment dropdown) ----------
router.get('/riders', protectAdmin, async (req, res) => {
  try {
    const riders = await User.find({ role: 'rider', isActive: true }).select('name email phone vehicle');
    res.json(riders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Reports ----------
// GET /api/admin/reports/sales — weekly revenue buckets (last 8 weeks)
router.get('/reports/sales', protectAdmin, async (req, res) => {
  try {
    const WEEKS = 8;
    const now = new Date();

    // Build 8 consecutive 7-day buckets ending "now", oldest first
    const buckets = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 7);
      buckets.push({ start, end, revenue: 0 });
    }

    const orders = await Order.find({
      createdAt: { $gte: buckets[0].start },
      $or: [{ status: 'delivered' }, { 'payment.status': 'paid' }],
    }).select('createdAt payment.amount');

    orders.forEach((o) => {
      const t = new Date(o.createdAt);
      const bucket = buckets.find((b) => t >= b.start && t < b.end);
      if (bucket) bucket.revenue += o.payment?.amount || 0;
    });

    const data = buckets.map((b) => ({
      period: `${b.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${b.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      revenue: b.revenue,
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/reports/rider-performance
router.get('/reports/rider-performance', protectAdmin, async (req, res) => {
  try {
    // A delivery counts as "on time" if it went from out_for_delivery to
    // delivered within this many minutes. No delivery deadline is stored
    // anywhere yet, so this is a business default rather than a real target.
    const ON_TIME_THRESHOLD_MINUTES = 45;

    const riders = await User.find({ role: 'rider' }).select('name');

    const data = await Promise.all(
      riders.map(async (rider) => {
        const orders = await Order.find({ rider: rider._id, status: 'delivered' })
          .select('riderEarning timeline rating');

        let earnings = 0;
        let onTimeCount = 0;
        let ratingSum = 0;
        let ratedCount = 0;

        orders.forEach((o) => {
          earnings += o.riderEarning || 0;

          if (typeof o.rating === 'number') {
            ratingSum += o.rating;
            ratedCount += 1;
          }

          const timeline = o.timeline || [];
          const outEntry = [...timeline].reverse().find((t) => t.status === 'out_for_delivery');
          const deliveredEntry = [...timeline].reverse().find((t) => t.status === 'delivered');
          if (outEntry && deliveredEntry) {
            const minutes = (new Date(deliveredEntry.timestamp) - new Date(outEntry.timestamp)) / 60000;
            if (minutes <= ON_TIME_THRESHOLD_MINUTES) onTimeCount += 1;
          }
        });

        return {
          _id: rider._id,
          name: rider.name,
          earnings,
          onTime: orders.length ? Math.round((onTimeCount / orders.length) * 100) : 0,
          rating: ratedCount ? Number((ratingSum / ratedCount).toFixed(1)) : null,
        };
      })
    );

    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Support Tickets ----------
// GET /api/admin/tickets
router.get('/tickets', protectAdmin, async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('user', 'name email')
      .populate('replies.sender', 'name role')
      .sort('-createdAt');
    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/tickets/:id  (mark resolved)
router.put('/tickets/:id', protectAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/tickets/:id/reply  (admin replies to a ticket)
router.post('/tickets/:id/reply', protectAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $push: { replies: { sender: req.user._id, message: message.trim() } } },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('replies.sender', 'name role');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Transactions (payments + withdrawals combined) ----------
// GET /api/admin/transactions?type=payment|withdrawal
router.get('/transactions', protectAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    let transactions = [];
 
    if (!type || type === 'payment') {
      const payments = await Transaction.find().populate('user', 'name email').sort('-createdAt');
      transactions.push(
        ...payments.map((t) => ({
          _id: t._id,
          type: 'payment',
          amount: t.amount,
          status: 'completed',
          user: t.user,
          createdAt: t.createdAt,
        }))
      );
    }
 
    if (!type || type === 'withdrawal') {
      const withdrawals = await WithdrawalRequest.find().populate('user', 'name email').sort('-createdAt');
      transactions.push(
        ...withdrawals.map((w) => ({
          _id: w._id,
          type: 'withdrawal',
          amount: w.amount,
          status: w.status,
          user: w.user,
          createdAt: w.createdAt,
        }))
      );
    }
 
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// PUT /api/admin/transactions/:id  (approve/reject a withdrawal)
router.put('/transactions/:id', protectAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const withdrawal = await WithdrawalRequest.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
 
    withdrawal.status = action === 'approve' ? 'approved' : 'rejected';
    withdrawal.processedAt = new Date();
    await withdrawal.save();
 
    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
// ---------- Banners ----------
router.get('/banners', protectAdmin, async (req, res) => {
  const banners = await Banner.find().sort('order');
  res.json(banners);
});
 
router.post('/banners', protectAdmin, async (req, res) => {
  try {
    const { imageUrl, link, isActive, order } = req.body;
    const banner = await Banner.create({ imageUrl, link, isActive, order });
    res.status(201).json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
router.put('/banners/:id', protectAdmin, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
router.delete('/banners/:id', protectAdmin, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
module.exports = router;