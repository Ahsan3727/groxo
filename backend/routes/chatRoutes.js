const router = require('express').Router();
const chatCtrl = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, chatCtrl.sendMessage);
router.get('/', authMiddleware, chatCtrl.getMessages);

module.exports = router;
