const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  expoPushToken: { type: String },
  role: {
    type: String,
    enum: ['customer', 'rider', 'wholesaler', 'admin'],
    default: 'customer'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String
  },
  vehicle: {
    type: { type: String },
    plateNumber: String,
    color: String
  },
  storeName: String,
  businessLicense: String,
  storeAddress: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  lastLocationUpdate: Date,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);