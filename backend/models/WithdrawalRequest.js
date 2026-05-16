const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    ifsc: String
  },
  processedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
