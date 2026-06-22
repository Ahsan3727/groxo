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
const Banner = require('../models/Banner');

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
// PUT /api/admin/orders/:id/pay-wholesaler  – mark wholesaler as paid
router.put('/orders/:id/pay-wholesaler', protectAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.wholesalerPaid = true;
    await order.save();

    res.json({ message: 'Wholesaler marked as paid', order });
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

// PUT /api/admin/orders/:id/settle  – mark rider as settled
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

module.exports = router;