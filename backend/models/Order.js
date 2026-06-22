const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Existing financial / settlement fields
  codAmount: { type: Number, default: 0 },
  riderEarning: { type: Number, default: 0 },
  wholesalerEarning: { type: Number, default: 0 },
  platformCommission: { type: Number, default: 0 },
  riderSettled: { type: Boolean, default: false },
  wholesalerPaid: { type: Boolean, default: false },
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
  // Legacy single‑wholesaler fields (kept for old orders)
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
    price: { type: Number, required: true },
  }],
  // ─── NEW: Multi‑vendor groups (one per wholesaler) ───
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
    paid: { type: Boolean, default: false },
  }],
  shopLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],   // [longitude, latitude]
      default: [0, 0],
    },
    address: String,
  },
  locationSet: {
    type: Boolean,
    default: false,
  },
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
  packingStatus: {
    type: String,
    enum: ['pending', 'packing', 'ready'],
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
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);