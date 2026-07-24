const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  label: String,
  address: String,
  lat: Number,
  lng: Number,
  isDefault: { type: Boolean, default: false }
});

module.exports = mongoose.model('Address', addressSchema);
