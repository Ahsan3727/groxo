const router = require('express').Router();
const reportCtrl = require('../controllers/reportController');
const { protect, roleAuth } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, roleAuth('admin'), reportCtrl.getDashboardStats);
router.get('/sales', protect, roleAuth('admin'), reportCtrl.getSalesReport);

module.exports = router;
