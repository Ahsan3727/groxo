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
    sparse: true,
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // All items in the order (for customer view / rider summary)
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
  }],
  // Wholesaler groups – each group represents one wholesaler’s part
  wholesalerGroups: [{
    wholesaler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeName: String,
    items: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
    }],
    status: {
      type: String,
      enum: ['packing', 'ready_for_pickup'],
      default: 'packing',
    },
    packedAt: Date,
    paid: { type: Boolean, default: false },   // admin marks true after paying this wholesaler
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
      'packing',           // at least one group still packing
      'ready_for_pickup',  // all groups ready
      'out_for_delivery',
      'delivered',
      'cancelled',
      'disputed',
    ],
    default: 'pending',
  },
  confirmedByAdmin: {
    type: Boolean,
    default: false,
  },
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
  // Money fields (optional, for manual tracking)
  codAmount: { type: Number, default: 0 },
  riderEarning: { type: Number, default: 0 },
  wholesalerEarning: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 0 },
  riderSettled: { type: Boolean, default: false },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);