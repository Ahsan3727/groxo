const { sendNotification } = require('../services/notificationService');
const User = require('../models/User');

exports.send = async (req, res, next) => {
  try {
    const { userId, type, title, body, data } = req.body;
    const recipient = await User.findById(userId);
    if (!recipient) return res.status(404).json({ message: 'User not found' });
    await sendNotification(recipient, type, title, body, data);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
