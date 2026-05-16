const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wholesaler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'disputed'],
    default: 'pending'
  },
  payment: {
    method: String,
    status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    amount: Number,
    transactionId: String
  },
  deliveryAddress: {
    address: String,
    lat: Number,
    lng: Number
  },
  pickupLocation: {
    lat: Number,
    lng: Number
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  riderLocation: { lat: Number, lng: Number },
  cancellationReason: String,
  deliveryProof: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
