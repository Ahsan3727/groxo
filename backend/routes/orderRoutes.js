const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');   // ← needed for the /available route
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

// ---------- RIDER: Get available (unassigned) pending orders ----------
// MUST be defined before the /:id route to avoid "available" being treated as an ObjectId
router.get('/available', protect, async (req, res) => {
  try {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Rider access only' });
    }

    const orders = await Order.find({
      status: 'pending',      // only pending orders
      rider: null,            // no rider assigned yet
    })
      .populate('wholesaler', 'storeName name address')
      .populate('customer', 'name phone deliveryAddress')
      .sort({ createdAt: -1 });

    res.json(orders);         // the rider app expects an array (or { orders })
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- Get single order (admin / rider / wholesaler) ----------
router.get('/:id', protect, getOrder);

// ---------- Update order status (rider / admin) ----------
router.put('/:id/status', protect, updateOrderStatus);

// ---------- Admin: assign rider to order ----------
router.put('/:id/assign', protect, assignRider);

module.exports = router;