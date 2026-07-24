const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const { getWholesalerWalletBalance } = require('../utils/wholesalerEarnings');

// ---------- GET WALLET BALANCE ----------
// Previously computed from the Transaction ledger — but nothing anywhere
// in this codebase ever creates a `credit` Transaction when an order is
// delivered, so this always returned 0 for a real wholesaler. Now computed
// directly from delivered/paid orders (see utils/wholesalerEarnings.js),
// which is the same real data Dashboard/Earnings already show.
exports.getWalletBalance = async (req, res, next) => {
  try {
    if (req.user.role !== 'wholesaler') {
      return res.status(403).json({ message: 'Wholesaler access only' });
    }
    const wallet = await getWholesalerWalletBalance(req.user._id);
    res.json(wallet);
  } catch (err) {
    next(err);
  }
};

// ---------- GET TRANSACTIONS (ledger history, if any exist) ----------
exports.getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort('-createdAt');
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

// ---------- GET MY WITHDRAWAL REQUESTS ----------
exports.getMyWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ user: req.user._id }).sort('-createdAt');
    res.json(withdrawals);
  } catch (err) {
    next(err);
  }
};

// ---------- REQUEST WITHDRAWAL ----------
exports.requestWithdrawal = async (req, res, next) => {
  try {
    if (req.user.role !== 'wholesaler') {
      return res.status(403).json({ message: 'Wholesaler access only' });
    }

    const { amount, bankAccount } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'A valid withdrawal amount is required' });
    }
    if (!bankAccount?.bankName || !bankAccount?.accountNumber) {
      return res.status(400).json({ message: 'Bank name and account number are required' });
    }

    const wallet = await getWholesalerWalletBalance(req.user._id);
    if (numericAmount > wallet.balance) {
      return res.status(400).json({
        message: `Withdrawal amount exceeds your available balance (Rs. ${wallet.balance.toFixed(2)})`,
      });
    }

    const withdrawal = await WithdrawalRequest.create({
      user: req.user._id,
      amount: numericAmount,
      bankAccount: {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        ifsc: bankAccount.ifsc || '',
      },
    });
    res.status(201).json(withdrawal);
  } catch (err) {
    next(err);
  }
};

// ---------- ADMIN: APPROVE / MARK PAID A WITHDRAWAL ----------
// Note: the admin panel already has an equivalent, actively-used endpoint
// at PUT /api/admin/transactions/:id — this one exists for API completeness
// and is now correctly restricted to admins only (previously had no role
// check at all, meaning any authenticated wholesaler could hit this and
// approve their own — or anyone else's — withdrawal).
exports.approveWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await WithdrawalRequest.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    withdrawal.status = 'approved';
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    await Transaction.create({
      user: withdrawal.user,
      amount: withdrawal.amount,
      type: 'debit',
      description: 'Withdrawal approved',
      reference: withdrawal._id.toString(),
    });

    res.json(withdrawal);
  } catch (err) {
    next(err);
  }
};
