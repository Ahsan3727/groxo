const mongoose = require('mongoose');
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
  await User.create({
    phone: '9999999999',
    password: 'admin123',
    role: 'admin',
    name: 'Super Admin',
    isApproved: true,
    isVerified: true
  });
  console.log('Admin seeded');
  process.exit();
};

seedAdmin();
