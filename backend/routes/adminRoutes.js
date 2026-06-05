const express = require('express');
const router = express.Router();
const {
  login,
  me,
  dashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');

// ---------- Auth / Admin info ----------
router.post('/login', login);
router.get('/me', protectAdmin, me);
router.get('/dashboard', protectAdmin, dashboard);

// ---------- User Management ----------
router.get('/users', protectAdmin, getUsers);
router.post('/users', protectAdmin, createUser);
router.put('/users/:id', protectAdmin, updateUser);
router.delete('/users/:id', protectAdmin, deleteUser);

// ---------- Location Endpoints (for HubMap) ----------
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

// GET /api/admin/customers/locations
router.get('/customers/locations', protectAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    const data = customers.map(c => {
      // Use currentLocation if exists, otherwise try address.lat/lng
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

router.get('/wholesalers/locations', protectAdmin, async (req, res) => {
  try {
    const wholesalers = await User.find({ role: 'wholesaler' }).select('-password');
    const data = wholesalers.map(w => ({
      _id: w._id,
      name: w.name,
      email: w.email,
      phone: w.phone,
      storeName: w.storeName,
      businessLicense: w.businessLicense,
      isActive: w.isActive,
      currentLocation: w.currentLocation
        ? { lat: w.currentLocation.coordinates[1], lng: w.currentLocation.coordinates[0] }
        : null,
      lastLocationUpdate: w.lastLocationUpdate,
      status: 'wholesaler',
    }));
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

router.put('/products/:id', protectAdmin, async (req, res) => {
  try {
    const { status, adminPrice } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (status) {
      product.status = status;
      product.isApproved = status === 'approved';
    }
    if (adminPrice != null) product.adminPrice = adminPrice;

    await product.save();
    res.json(product);
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
      .populate('rider', 'name phone vehicle')
      .populate('items.product', 'name price')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
    await order.populate(['customer', 'wholesaler', 'rider', 'items.product']);
    res.json(order);
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

module.exports = router;