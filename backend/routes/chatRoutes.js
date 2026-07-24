const router = require('express').Router();
const chatCtrl = require('../controllers/chatController');
// Same authMiddleware→protect bug as paymentRoutes.js had — fixed here too
// before mounting, for the same reason (this would crash the server at
// boot otherwise).
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, chatCtrl.sendMessage);
router.get('/', protect, chatCtrl.getMessages);

module.exports = router;
