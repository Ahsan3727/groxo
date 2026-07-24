const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label: String,
  // CustomerApp's AddAddressScreen collects these three fields specifically
  // (see screens/AddAddressScreen.js) — kept as separate fields rather than
  // forcing them into the legacy single-line `address` string below.
  line1: String,
  city: String,
  pincode: String,
  // Legacy single-line field, kept so any older callers that only ever sent
  // `address` (no line1/city/pincode) still round-trip without data loss.
  address: String,
  lat: Number,
  lng: Number,
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
