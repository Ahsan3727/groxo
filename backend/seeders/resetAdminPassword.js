// One-off utility to reset an existing admin's password directly against
// the live database — safe to run any time, unlike adminSeeder.js (which
// refuses to run again once an admin already exists).
//
// Usage (run from the backend/ folder, e.g. via Render's Shell tab):
//   node seeders/resetAdminPassword.js <phone-or-email>
//   node seeders/resetAdminPassword.js <phone-or-email> "MyNewPassword123!"
//
// If you don't pass a password, one is generated and printed once — copy
// it immediately, it is never shown or stored anywhere else. Password is
// set through the User model's normal `.save()` so the existing
// pre('save') bcrypt hook hashes it correctly — this does NOT write a
// plaintext or manually-hashed value directly into the database.

const crypto = require('crypto');
const User = require('../models/User');
require('../config/environment');
const connectDB = require('../config/db');

const identifier = process.argv[2];
const suppliedPassword = process.argv[3];

if (!identifier) {
  console.error('Usage: node seeders/resetAdminPassword.js <phone-or-email> [newPassword]');
  process.exit(1);
}

const resetPassword = async () => {
  await connectDB();

  const admin = await User.findOne({
    role: 'admin',
    $or: [{ phone: identifier }, { email: identifier }],
  });

  if (!admin) {
    console.error(`No admin account found with phone or email "${identifier}".`);
    console.error('Run `node seeders/adminSeeder.js` first if no admin exists yet.');
    process.exit(1);
  }

  const newPassword = suppliedPassword || crypto.randomBytes(12).toString('base64url');

  admin.password = newPassword; // pre('save') hook hashes this on save
  await admin.save();

  console.log(`Password reset for admin: ${admin.name} (${admin.email || admin.phone})`);
  if (!suppliedPassword) {
    console.log('Generated password — save this now, it will not be shown again:');
    console.log(`  ${newPassword}`);
  } else {
    console.log('Password set to the value you provided.');
  }
  process.exit(0);
};

resetPassword().catch((err) => {
  console.error('Reset failed:', err.message);
  process.exit(1);
});
