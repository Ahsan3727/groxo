const mongoose = require('mongoose');

// Records who did what, to which record, and when — for money-moving and
// destructive admin actions (settlements, withdrawal approve/reject, price
// changes, product approvals, user edits/deletes). Write-only from the
// app's perspective; nothing in the admin panel currently deletes rows
// from this collection.
const adminAuditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. 'user.delete', 'product.approve', 'withdrawal.approve'
  targetType: { type: String },             // e.g. 'User', 'Product', 'Order', 'WithdrawalRequest'
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed }, // free-form context (amounts, before/after, reason, etc.)
  createdAt: { type: Date, default: Date.now },
});

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ admin: 1, createdAt: -1 });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
