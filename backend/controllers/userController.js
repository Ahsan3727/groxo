const User = require('../models/User');
const upload = require('../middleware/multer');

exports.getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'email', 'avatar', 'vehicleDetails', 'shopName', 'businessHours', 'taxInfo', 'bankAccount'];
    const updates = {};
    allowedUpdates.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.uploadDocuments = async (req, res, next) => {
  try {
    // req.files is array of documents
    const filePaths = req.files.map(f => f.path);
    const user = await User.findByIdAndUpdate(req.user.id, { $push: { documents: { $each: filePaths } } }, { new: true });
    res.json({ documents: user.documents });
  } catch (err) {
    next(err);
  }
};

exports.approveUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
    res.json(user);
  } catch (err) {
    next(err);
  }
};
