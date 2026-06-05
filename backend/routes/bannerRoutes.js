const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');

// GET /api/banners (active only)
router.get('/', async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort('order');
  res.json(banners);
});

module.exports = router;