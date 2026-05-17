const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const ctrl = require('../controllers/riderController');
router.get('/', auth, roleAuth('admin'), ctrl.getRiders);
router.get('/:id', auth, ctrl.getRider);
router.put('/:id', auth, ctrl.updateRider);
module.exports = router;
