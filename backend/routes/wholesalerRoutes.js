const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const ctrl = require('../controllers/wholesalerController');
router.get('/', auth, roleAuth('admin'), ctrl.getWholesalers);
router.get('/:id', auth, ctrl.getWholesaler);
router.put('/:id', auth, ctrl.updateWholesaler);
module.exports = router;
