const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const User = require('../models/User');

exports.getWalletBalance = async (req, res, next) => {
  try {
    const credits = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const debits = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'debit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const balance = (credits[0]?.total || 0) - (debits[0]?.total || 0);
    res.json({ balance });
  } catch (err) {
    next(err);
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort('-createdAt');
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const withdrawal = new WithdrawalRequest({ user: req.user._id, amount });
    await withdrawal.save();
    res.status(201).json(withdrawal);
  } catch (err) {
    next(err);
  }
};

exports.approveWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await WithdrawalRequest.findByIdAndUpdate(req.params.id, { status: 'approved', processedAt: new Date() }, { new: true });
    // Debit user wallet
    await Transaction.create({
      user: withdrawal.user,
      amount: withdrawal.amount,
      type: 'debit',
      description: 'Withdrawal',
      reference: withdrawal._id,
      balanceBefore: 0, // calculate properly
      balanceAfter: 0
    });
    res.json(withdrawal);
  } catch (err) {
    next(err);
  }
};
