const router = require('express').Router();
const reportCtrl = require('../controllers/reportController');
const { authMiddleware, roleAuth } = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, roleAuth('admin'), reportCtrl.getDashboardStats);
router.get('/sales', authMiddleware, roleAuth('admin'), reportCtrl.getSalesReport);

module.exports = router;
