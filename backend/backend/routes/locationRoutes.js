const router = require('express').Router();
const locCtrl = require('../controllers/locationController');
const { authMiddleware, roleAuth } = require('../middleware/authMiddleware');

router.put('/', authMiddleware, roleAuth('rider'), locCtrl.updateLocation);
router.get('/:riderId', authMiddleware, locCtrl.getRiderLocation);

module.exports = router;
