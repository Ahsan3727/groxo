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
  updateGroupStatus,          // ← import for group‑status endpoint
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
      .populate('wholesaler', 'storeName name address')                 // old orders
      .populate('wholesalerGroups.wholesaler', 'storeName name address') // new orders
      .populate('customer', 'name phone deliveryAddress')
      .sort({ createdAt: -1 });

    // Build a clear pickup label for the rider
    const mapped = orders.map(order => {
      let pickup = 'Store';
      if (order.wholesalerGroups && order.wholesalerGroups.length > 0) {
        pickup = order.wholesalerGroups
          .map(g => g.storeName || g.wholesaler?.storeName || 'Store')
          .join(', ');
      } else if (order.wholesaler) {
        pickup = order.wholesaler.storeName || order.wholesaler.name || 'Store';
      }
      return { ...order.toObject(), pickup };
    });

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
    // Populate both old and new wholesaler fields so the rider sees names
    await order.populate([
      'customer',
      'wholesaler',               // old single wholesaler
      'wholesalerGroups.wholesaler', // new groups
      'rider',
      'items.product',
    ]);

    const io = req.app.get('io');
    if (io) io.emit('orderUpdated', order);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- WHOLESALER: Update own group status ----------
router.put('/group-status', protect, updateGroupStatus);

// ---------- Get single order ----------
router.get('/:id', protect, getOrder);

// ---------- Update order status ----------
router.put('/:id/status', protect, updateOrderStatus);

// ---------- Admin: assign rider ----------
router.put('/:id/assign', protect, assignRider);

module.exports = router;