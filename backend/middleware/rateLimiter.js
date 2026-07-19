const rateLimit = require('express-rate-limit');

// General-purpose limiter — safe default for any route that doesn't have
// a more specific limiter of its own.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Strict limiter for login endpoints specifically. Admin and regular auth
// login were previously unprotected against brute force — this caps
// attempts per IP regardless of which email/phone is being tried, so
// guessing passwords (including the seeded default admin credential) is
// no longer cheap. Failed logins only count against the limit by default;
// tune skipSuccessfulRequests off if you want successful logins to count
// too.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts. Please try again in a few minutes.' },
});

module.exports = { apiLimiter, loginLimiter };
