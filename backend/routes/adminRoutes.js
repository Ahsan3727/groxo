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
const User = require('../models/User');

router.post('/login', login);
router.get('/me', protectAdmin, me);
router.get('/dashboard', protectAdmin, dashboard);
// GET /api/admin/wholesalers/locations
router.get('/wholesalers/locations', protectAdmin, async (req, res) => {
  try {
    const wholesalers = await User.find({ role: 'wholesaler' }).select('-password');
    const data = wholesalers.map(w => ({
      _id: w._id,
      name: w.name,
      email: w.email,
      phone: w.phone,
      storeName: w.storeName,
      businessLicense: w.businessLicense,
      isActive: w.isActive,
      currentLocation: w.currentLocation
        ? { lat: w.currentLocation.coordinates[1], lng: w.currentLocation.coordinates[0] }
        : null,
      lastLocationUpdate: w.lastLocationUpdate,
      status: 'wholesaler',  // special status for map marker
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET /api/admin/customers/locations
router.get('/customers/locations', protectAdmin, async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('-password');
    const data = customers.map(c => ({
      _id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      isActive: c.isActive,
      address: c.address,
      currentLocation: c.currentLocation
        ? { lat: c.currentLocation.coordinates[1], lng: c.currentLocation.coordinates[0] }
        : null,
      lastLocationUpdate: c.lastLocationUpdate,
      // Customers don't have a "status" like riders, but we can set a default
      status: 'customer',
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// GET /api/admin/riders/locations
router.get('/riders/locations', protectAdmin, async (req, res) => {
  try {
    const riders = await User.find({ role: 'rider' }).select('-password');
    const data = riders.map(r => ({
      _id: r._id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      isActive: r.isActive,
      vehicle: r.vehicle,
      currentLocation: r.currentLocation
        ? { lat: r.currentLocation.coordinates[1], lng: r.currentLocation.coordinates[0] }
        : null,
      lastLocationUpdate: r.lastLocationUpdate,
      status: r.isActive ? 'online' : 'offline',
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User management CRUD
router.get('/users', protectAdmin, getUsers);
router.post('/users', protectAdmin, createUser);
router.put('/users/:id', protectAdmin, updateUser);
router.delete('/users/:id', protectAdmin, deleteUser);

module.exports = router;