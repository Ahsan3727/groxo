const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  wholesaler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  retailPrice: { type: Number, default: 0 },
category: { type: String, required: true },  // the category name (string)
  image: { type: String },        // <-- ADD THIS LINE
  weight: { type: Number },  // optional, in kg
unit: { type: String, enum: ['piece', 'kg', 'liter', 'pack', 'box', 'dozen', 'other'], default: 'piece' },
  stock: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lowStockThreshold: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false },
adminPrice: { type: Number },               // final price set by admin
wholesalerPrice: { type: Number },           // cost price from wholesaler
status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
});

module.exports = mongoose.model('Product', productSchema);
