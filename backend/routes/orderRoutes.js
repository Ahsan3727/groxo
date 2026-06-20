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
} = require('../controllers/orderController');

// ---------- CUSTOMER: Place order ----------
router.post('/', protect, createOrder);

// ---------- ADMIN / WHOLESALER / RIDER: Get orders (role‑based) ----------
router.get('/', protect, getOrders);

// ---------- RIDER: Get available (unassigned) orders ----------
// Now includes both 'pending' and 'confirmed' orders without a rider
router.get('/available', protect, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Rider access only' });
    }

    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed'] },
      rider: null,
    })
      .populate('wholesaler', 'storeName name address')
      .populate('customer', 'name phone deliveryAddress')
      .sort({ createdAt: -1 });

    res.json(orders);
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
    // Keep the current status (will be changed later by rider or wholesaler)
    order.timeline.push({
      status: order.status,
      timestamp: new Date(),
      note: `Accepted by rider ${req.user.name}`,
    });
    await order.save();
    await order.populate(['customer', 'wholesaler', 'rider', 'items.product']);

    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', order);   // let everyone know
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Get single order ----------
router.get('/:id', protect, getOrder);

// ---------- Update order status ----------
router.put('/:id/status', protect, updateOrderStatus);

// ---------- Admin: assign rider ----------
router.put('/:id/assign', protect, assignRider);

module.exports = router;