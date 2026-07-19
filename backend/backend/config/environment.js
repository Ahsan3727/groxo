const dotenv = require('dotenv');
dotenv.config();

// No insecure fallback here on purpose — a missing JWT_SECRET must fail
// loudly (see requireEnv() in server.js), not silently become a guessable
// default like the old 'dev_secret' value did.
module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
};
