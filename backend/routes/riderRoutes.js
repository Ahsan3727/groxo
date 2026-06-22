const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Order = require('../models/Order');

// ---------- GET active order for the logged-in rider ----------
router.get('/active-order', protect, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Rider access only' });
    }

    const order = await Order.findOne({
      rider: req.user._id,
      status: { $nin: ['delivered', 'cancelled'] }
    })
      .populate('wholesaler', 'storeName name address')
      .populate('customer', 'name phone deliveryAddress');

    res.json({ order });   // null if no active order
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- PUT /api/rider/location (unchanged) ----------
router.put('/location', protect, async (req, res) => {
  if (req.user.role !== 'rider') {
    return res.status(403).json({ message: 'Rider access only' });
  }

  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat and lng are required' });
  }

  try {
    const rider = await User.findById(req.user._id);
    rider.currentLocation = { type: 'Point', coordinates: [lng, lat] };
    rider.lastLocationUpdate = new Date();
    await rider.save();

    const activeDelivery = await Order.findOne({
      rider: req.user._id,
      status: 'out_for_delivery',
    });

    if (activeDelivery) {
      const io = req.app.get('io');
      if (io) {
        io.to(activeDelivery.customer.toString()).emit('riderLocationUpdate', {
          orderId: activeDelivery._id,
          lat,
          lng,
          timestamp: new Date(),
        });
      }
    }

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- PUT /api/rider/push-token (unchanged) ----------
router.put('/push-token', protect, async (req, res) => {
  const { expoPushToken } = req.body;
  if (!expoPushToken) return res.status(400).json({ message: 'Token required' });

  try {
    const user = await User.findById(req.user._id);
    user.expoPushToken = expoPushToken;
    await user.save();
    res.json({ message: 'Push token saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- GET /api/rider/dashboard (unchanged) ----------
router.get('/dashboard', protect, async (req, res) => {
  if (req.user.role !== 'rider') {
    return res.status(403).json({ message: 'Rider access only' });
  }
  res.json({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalDeliveries: 0,
    rating: 5.0,
  });
});
// GET /api/rider/:riderId/location
router.get('/:riderId/location', protect, async (req, res) => {
  try {
    // Only admins or the same rider can access (optional restriction)
    const rider = await User.findById(req.params.riderId).select('currentLocation');
    if (!rider) return res.status(404).json({ message: 'Rider not found' });

    const loc = rider.currentLocation;
    if (loc && loc.coordinates && loc.coordinates.length === 2) {
      return res.json({
        lat: loc.coordinates[1],
        lng: loc.coordinates[0],
      });
    }
    res.json(null); // no location yet
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET /api/rider/dashboard
router.get('/dashboard', protect, async (req, res) => {
  if (req.user.role !== 'rider') {
    return res.status(403).json({ message: 'Rider access only' });
  }

  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all delivered orders for this rider
    const orders = await Order.find({
      rider: req.user._id,
      status: 'delivered',
    });

    // Today's orders
    const todayOrders = orders.filter(o => o.createdAt >= today && o.createdAt < tomorrow);

    // Today's earnings (delivery fees)
    const todayEarnings = todayOrders.reduce((sum, o) => sum + (o.riderEarning || 0), 0);

    // Completed deliveries today
    const todayDeliveries = todayOrders.length;

    // COD balance: total collected but not yet settled
    const unsettledCOD = orders
      .filter(o => o.payment?.method === 'cod' && !o.riderSettled)
      .reduce((sum, o) => sum + (o.codAmount || 0), 0);

    // COD settled: total already handed over
    const settledCOD = orders
      .filter(o => o.payment?.method === 'cod' && o.riderSettled)
      .reduce((sum, o) => sum + (o.codAmount || 0), 0);

    res.json({
      todayEarnings,
      todayDeliveries,
      unsettledCOD,
      settledCOD,
      totalDeliveries: orders.length,   // lifetime deliveries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;