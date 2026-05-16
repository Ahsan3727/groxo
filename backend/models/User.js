const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: {
    type: String,
    enum: ['customer', 'rider', 'wholesaler', 'admin'],
    default: 'customer'
  },
  name: String,
  avatar: String,
  isVerified: { type: Boolean, default: false },
  vehicleDetails: {
    type: { type: String },
    number: String,
    license: String,
    insurance: String
  },
  documents: [String],
  shopName: String,
  shopLocation: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number]
  },
  businessHours: String,
  taxInfo: String,
  bankAccount: {
    bankName: String,
    accountNumber: String,
    ifsc: String
  },
  isApproved: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});
userSchema.index({ shopLocation: '2dsphere' });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
