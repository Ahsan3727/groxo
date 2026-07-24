const router = require('express').Router();
const locCtrl = require('../controllers/locationController');
const { protect, roleAuth } = require('../middleware/authMiddleware');

router.put('/', protect, roleAuth('rider'), locCtrl.updateLocation);
router.get('/:riderId', protect, locCtrl.getRiderLocation);

module.exports = router;
