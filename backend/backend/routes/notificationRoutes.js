const router = require('express').Router();
const notifCtrl = require('../controllers/notificationController');
const { authMiddleware, roleAuth } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, roleAuth('admin'), notifCtrl.send);

module.exports = router;
