const router = require('express').Router();
const payCtrl = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/wallet', authMiddleware, payCtrl.getWalletBalance);
router.get('/transactions', authMiddleware, payCtrl.getTransactions);
router.post('/withdraw', authMiddleware, payCtrl.requestWithdrawal);
router.put('/withdraw/:id/approve', authMiddleware, payCtrl.approveWithdrawal);

module.exports = router;
