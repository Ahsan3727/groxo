const mongoose = require('mongoose');

const riderLocationSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: [Number]
  },
  isOnline: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
});
riderLocationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RiderLocation', riderLocationSchema);
