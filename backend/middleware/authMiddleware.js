const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

exports.protectAdmin = async (req, res, next) => {
  await exports.protect(req, res, async () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }
    next();
  });
};

// Restricts a route to one or more roles, e.g. roleAuth('admin'), roleAuth('rider', 'admin').
// Must run AFTER `protect` in the middleware chain (it relies on req.user being set).
// locationRoutes.js, notificationRoutes.js, reportRoutes.js and supportRoutes.js all
// import this — without it, requiring those files throws at server boot.
exports.roleAuth = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};