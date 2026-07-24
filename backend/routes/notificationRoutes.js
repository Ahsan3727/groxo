const router = require('express').Router();
const notifCtrl = require('../controllers/notificationController');
const { protect, roleAuth } = require('../middleware/authMiddleware');

router.post('/', protect, roleAuth('admin'), notifCtrl.send);

// ---------- Any logged-in user: read their own notification inbox ----------
router.get('/', protect, notifCtrl.getMyNotifications);
router.put('/:id/read', protect, notifCtrl.markAsRead);

module.exports = router;
