const router = require('express').Router();
const productCtrl = require('../controllers/productController');
const { authMiddleware, roleAuth } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, roleAuth('wholesaler'), productCtrl.createProduct);
router.get('/', productCtrl.getProducts);
router.get('/pending', authMiddleware, roleAuth('admin'), productCtrl.getPendingProducts);
router.get('/:id', productCtrl.getProduct);
router.put('/:id', authMiddleware, roleAuth('wholesaler', 'admin'), productCtrl.updateProduct);
router.delete('/:id', authMiddleware, roleAuth('wholesaler'), productCtrl.deleteProduct);
router.put('/:id/approve', authMiddleware, roleAuth('admin'), productCtrl.approveProduct);

module.exports = router;
