const router = require('express').Router();
const orderCtrl = require('../controllers/orderController');
const { authMiddleware, roleAuth } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, roleAuth('customer'), orderCtrl.createOrder);
router.get('/', authMiddleware, orderCtrl.getOrders);
router.get('/:id', authMiddleware, orderCtrl.getOrder);
router.put('/:id/status', authMiddleware, roleAuth('rider', 'wholesaler', 'admin'), orderCtrl.updateOrderStatus);
router.put('/:id/cancel', authMiddleware, roleAuth('customer', 'admin'), orderCtrl.cancelOrder);
router.put('/:id/assign-rider', authMiddleware, roleAuth('admin', 'wholesaler'), orderCtrl.assignRider);

module.exports = router;
