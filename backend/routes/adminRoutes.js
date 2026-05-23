const express = require('express');
const router = express.Router();
const {
  login,
  me,
  dashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', protectAdmin, me);
router.get('/dashboard', protectAdmin, dashboard);

// User management CRUD
router.get('/users', protectAdmin, getUsers);
router.post('/users', protectAdmin, createUser);
router.put('/users/:id', protectAdmin, updateUser);
router.delete('/users/:id', protectAdmin, deleteUser);

module.exports = router;