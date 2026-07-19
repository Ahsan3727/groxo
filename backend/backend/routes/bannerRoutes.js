const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// GET /api/banners (active only, and — if scheduled — within the window)
router.get('/', async (req, res) => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  }).sort('order');
  res.json(banners);
});

module.exports = router;