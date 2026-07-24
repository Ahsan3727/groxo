const router = require('express').Router();
const supportCtrl = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, supportCtrl.createTicket);
router.get('/', protect, supportCtrl.getTickets);
router.post('/:id/reply', protect, supportCtrl.addReply);

module.exports = router;
