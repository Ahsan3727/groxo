const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  assignRider,
  updateGroupStatus,          // ← import added
} = require('../controllers/orderController');

// ---------- CUSTOMER: Place order ----------
router.post('/', protect, createOrder);

// ---------- ADMIN / WHOLESALER / RIDER: Get orders ----------
router.get('/', protect, getOrders);

// ---------- RIDER: Get available (unassigned) orders ----------
router.get('/available', protect, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Rider access only' });
    }

    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed'] },
      rider: null,
    })
      .populate('wholesalerGroups.wholesaler', 'storeName name address')
      .populate('customer', 'name phone deliveryAddress')
      .sort({ createdAt: -1 });

    const mapped = orders.map(order => ({
      ...order.toObject(),
      pickup: order.wholesalerGroups?.[0]?.wholesaler?.storeName ||
              order.wholesalerGroups?.[0]?.storeName ||
              order.wholesaler?.storeName ||
              'Store',
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- RIDER: Accept an order (self‑assign) ----------
router.put('/:id/accept', protect, async (req, res) => {
  if (req.user.role !== 'rider') {
    return res.status(403).json({ message: 'Rider only' });
  }
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.rider) return res.status(400).json({ message: 'Order already assigned' });

    order.rider = req.user._id;
    order.timeline.push({
      status: order.status,
      timestamp: new Date(),
      note: `Accepted by rider ${req.user.name}`,
    });
    await order.save();
    await order.populate(['customer', 'wholesalerGroups.wholesaler', 'rider', 'items.product']);

    const io = req.app.get('io');
    if (io) io.emit('orderUpdated', order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- WHOLESALER: Update own group status ----------
router.put('/group-status', protect, updateGroupStatus);   // ← now defined

// ---------- Get single order ----------
router.get('/:id', protect, getOrder);

// ---------- Update order status (rider / admin) ----------
router.put('/:id/status', protect, updateOrderStatus);

// ---------- Admin: assign rider ----------
router.put('/:id/assign', protect, assignRider);

module.exports = router;