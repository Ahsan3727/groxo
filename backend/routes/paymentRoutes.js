const router = require('express').Router();
const payCtrl = require('../controllers/paymentController');
// BUG FIX: this previously imported `authMiddleware`, which does not exist
// as an export of middleware/authMiddleware.js (it exports `protect` and
// `protectAdmin`). Every route below was being registered with `undefined`
// as its handler, which makes Express throw `TypeError: argument handler
// must be a function` the instant this file is require()'d — crashing the
// whole server at boot the moment it's mounted in server.js.
const { protect, protectAdmin } = require('../middleware/authMiddleware');

router.get('/wallet', protect, payCtrl.getWalletBalance);
router.get('/transactions', protect, payCtrl.getTransactions);
router.get('/withdrawals', protect, payCtrl.getMyWithdrawals);
router.post('/withdraw', protect, payCtrl.requestWithdrawal);
// Admin-only: previously had no role check, so any authenticated user
// (including the wholesaler who filed the request) could approve it.
router.put('/withdraw/:id/approve', protectAdmin, payCtrl.approveWithdrawal);

module.exports = router;
