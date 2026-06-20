const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  assignRider,
} = require('../controllers/orderController');

// Customer places order
router.post('/', protect, createOrder);

// Get orders (filtered by role automatically)
// routes/orderRoutes.js
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    // Additional filters (e.g., only unassigned) can be added here
    const orders = await Order.find(filter)
      .populate('wholesaler', 'storeName name')
      .populate('customer', 'name');
    res.json(orders);   // or { orders }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/available', protect, async (req, res) => {
  // Ensure user is rider
  if (req.user.role !== 'rider') return res.status(403).json({ message: 'Access denied' });
  const orders = await Order.find({ status: 'pending', rider: null }) // unassigned pending
    .populate('wholesaler', 'storeName name');
  res.json(orders);
});
// Get single order
router.get('/:id', protect, getOrder);

// Update order status (rider/admin)
router.put('/:id/status', protect, updateOrderStatus);

// Admin: assign rider
router.put('/:id/assign', protect, assignRider);

module.exports = router;