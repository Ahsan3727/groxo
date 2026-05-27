const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('expoPushToken');
    if (!user || !user.expoPushToken) return;

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      console.error('Invalid Expo push token:', user.expoPushToken);
      return;
    }

    const messages = [{
      to: user.expoPushToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    console.error('Push notification error:', error);
  }
};

module.exports = sendPushNotification;