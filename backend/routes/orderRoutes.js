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
router.get('/', protect, getOrders);

// Get single order
router.get('/:id', protect, getOrder);

// Update order status (rider/admin)
router.put('/:id/status', protect, updateOrderStatus);

// Admin: assign rider
router.put('/:id/assign', protect, assignRider);

module.exports = router;