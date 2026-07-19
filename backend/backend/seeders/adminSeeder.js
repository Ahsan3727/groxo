const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
require('../config/environment');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  await connectDB();
  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) {
    console.log('Admin already exists');
    process.exit();
  }

  // The old version of this seeder hardcoded phone '9999999999' /
  // password 'admin123' for every fresh install — a guessable default
  // credential on a high-privilege account. Use SEED_ADMIN_PHONE /
  // SEED_ADMIN_PASSWORD from the environment if provided; otherwise
  // generate a random password and print it once so it can be captured
  // and stored securely (e.g. in a password manager) before it's lost.
  const phone = process.env.SEED_ADMIN_PHONE || '9999999999';
  const generatedPassword = crypto.randomBytes(12).toString('base64url');
  const password = process.env.SEED_ADMIN_PASSWORD || generatedPassword;

  await User.create({
    phone,
    password,
    role: 'admin',
    name: 'Super Admin',
    isApproved: true,
    isVerified: true,
  });

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('Admin seeded with a generated password — save this now, it will not be shown again:');
    console.log(`  phone: ${phone}`);
    console.log(`  password: ${password}`);
  } else {
    console.log('Admin seeded using SEED_ADMIN_PHONE / SEED_ADMIN_PASSWORD from the environment.');
  }
  process.exit();
};

seedAdmin();
