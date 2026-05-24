const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderNumber: {
  type: String,
  unique: true,
  sparse: true,   // allows multiple nulls? Actually we now always provide a value, so sparse not needed, but keep it safe
},
  wholesaler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },   // price at time of order
  }],
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
    lat: Number,
    lng: Number,
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'packing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'disputed',
    ],
    default: 'pending',
  },
  // NEW FIELDS
  packingStatus: {
    type: String,
    enum: ['pending', 'packing', 'ready'],
    default: 'pending',
  },
  confirmedByAdmin: {
    type: Boolean,
    default: false,
  },
  // END NEW FIELDS
  payment: {
    method: { type: String, enum: ['cod', 'online'], default: 'cod' },
    amount: Number,
    status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    transactionId: String,
  },
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],
  cancellationReason: String,
  riderLocation: {
    lat: Number,
    lng: Number,
  },
  pickupLocation: {
    lat: Number,
    lng: Number,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);