const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  link: { type: String, default: '' },          // e.g., 'ProductList' or a category
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },          // for sorting
  // Optional scheduling window. Both are optional and independent: a banner
  // with only startDate auto-starts and runs forever; only endDate means it
  // runs immediately and auto-expires; neither means "on/off manually via
  // isActive" (the old behaviour, preserved for existing banners).
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);