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

// Alias — chatRoutes.js, locationRoutes.js, notificationRoutes.js,
// paymentRoutes.js, reportRoutes.js and supportRoutes.js were all written
// against an `authMiddleware` export that never existed on this file (only
// `protect`/`protectAdmin` did). Since those routes were never mounted in
// server.js, this went unnoticed — requiring any of those files calls
// router.post/get with an undefined handler, which throws synchronously.
// Rather than rewrite six already-correct route files, we export the same
// `protect` function under the name they already expect.
exports.authMiddleware = exports.protect;

// Generic role-gate — same shape as protectAdmin but for any role(s),
// matching how locationRoutes/notificationRoutes/reportRoutes call it:
// roleAuth('rider'), roleAuth('admin'), etc. Must run AFTER authMiddleware
// in the route's middleware chain (it reads req.user, which authMiddleware sets).
exports.roleAuth = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: `${roles.join('/')} access only` });
  }
  next();
};