const router = require('express').Router();
const userCtrl = require('../controllers/userController');
const { authMiddleware, roleAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');

router.get('/', authMiddleware, roleAuth('admin'), userCtrl.getUsers);
router.get('/:id', authMiddleware, userCtrl.getUser);
router.put('/profile', authMiddleware, userCtrl.updateProfile);
router.post('/upload-docs', authMiddleware, upload.array('documents', 5), userCtrl.uploadDocuments);
router.put('/:id/approve', authMiddleware, roleAuth('admin'), userCtrl.approveUser);
router.put('/:id/ban', authMiddleware, roleAuth('admin'), userCtrl.banUser);

module.exports = router;
