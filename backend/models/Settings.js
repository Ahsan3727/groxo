const mongoose = require('mongoose');

// Singleton document — the app only ever reads/writes the first (and only)
// Settings record. Created lazily on first GET/PUT if it doesn't exist yet.
const settingsSchema = new mongoose.Schema({
  appName: { type: String, default: 'Groxo' },
  commission: { type: Number, default: 10 },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
