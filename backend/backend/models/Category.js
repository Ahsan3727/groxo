const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // For global categories, wholesaler is null / undefined
  wholesaler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  isGlobal: {
    type: Boolean,
    default: true,     // categories created by admin are global
  },
}, { timestamps: true });

// Ensure a global category name is unique across all wholesalers
categorySchema.index({ name: 1, isGlobal: 1 }, { unique: true, partialFilterExpression: { isGlobal: true } });

module.exports = mongoose.model('Category', categorySchema);