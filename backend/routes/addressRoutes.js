const router = require('express').Router();
const addressCtrl = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, addressCtrl.list);           // GET    /api/users/addresses
router.post('/', protect, addressCtrl.create);         // POST   /api/users/addresses
router.put('/:id', protect, addressCtrl.update);        // PUT    /api/users/addresses/:id
router.delete('/:id', protect, addressCtrl.remove);      // DELETE /api/users/addresses/:id
router.put('/:id/default', protect, addressCtrl.setDefault); // PUT /api/users/addresses/:id/default

module.exports = router;
