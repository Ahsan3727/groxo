const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  wholesaler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, { timestamps: true });

// A category name must be unique per wholesaler
categorySchema.index({ name: 1, wholesaler: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);