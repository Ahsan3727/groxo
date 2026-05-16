const router = require('express').Router();
const authCtrl = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/verify-otp', authCtrl.verifyOTP);
router.get('/me', authMiddleware, authCtrl.getMe);

module.exports = router;
