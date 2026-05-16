const { sendSMS } = require('./smsService');
const { sendEmail } = require('./emailService');
const { sendPush } = require('../utils/pushHelper');

const sendNotification = async (recipient, type, title, body, data = {}) => {
  // Save to DB
  const Notification = require('../models/Notification');
  await Notification.create({ recipient: recipient._id, type, title, body, data });

  // Send push, SMS, email based on user preferences (simplified)
  // In real app, check recipient's notification settings.
  console.log(`Sending ${type} notification to ${recipient.name || recipient.phone}`);
};

module.exports = { sendNotification };
