const router = require('express').Router();
const supportCtrl = require('../controllers/supportController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, supportCtrl.createTicket);
router.get('/', authMiddleware, supportCtrl.getTickets);
router.post('/:id/reply', authMiddleware, supportCtrl.addReply);

module.exports = router;
