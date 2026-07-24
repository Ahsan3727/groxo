const Notification = require('../models/Notification');
const { sendPushNotification } = require('../services/notificationService');
const User = require('../models/User');

// ---------- ADMIN: send a notification to a user ----------
// (Previously imported a `sendNotification` helper that doesn't exist in
// notificationService.js — only `sendPushNotification` is exported there.
// That made this endpoint throw a TypeError on every call. Fixed to use
// the real export, and to also persist a Notification document so the
// recipient has something to read back via GET /api/notifications.)
exports.send = async (req, res, next) => {
  try {
    const { userId, type, title, body, data } = req.body;
    const recipient = await User.findById(userId);
    if (!recipient) return res.status(404).json({ message: 'User not found' });

    // Always store the notification so it shows up in the recipient's inbox,
    // even if they have push notifications disabled or no push token yet.
    const notification = await Notification.create({
      recipient: recipient._id,
      type,
      title,
      body,
      data,
    });

    // Only attempt a push if the recipient has a token AND hasn't opted out.
    if (recipient.expoPushToken && recipient.notificationsEnabled !== false) {
      await sendPushNotification(recipient.expoPushToken, title, body, data);
    }

    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
};

// ---------- Logged-in user: get own notification inbox ----------
exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .limit(100);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// ---------- Logged-in user: mark one notification as read ----------
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
};
