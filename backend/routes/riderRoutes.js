const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, async (req, res) => {
  if (req.user.role !== 'rider') {
    return res.status(403).json({ message: 'Rider access only' });
  }
  res.json({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalDeliveries: 0,
    rating: 5.0
  });
});

module.exports = router;