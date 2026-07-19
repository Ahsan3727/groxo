const { Expo } = require('expo-server-sdk');

const expo = new Expo();

/**
 * Send a push notification to a single token.
 * @param {string} pushToken - Expo push token
 * @param {string} title       - Notification title
 * @param {string} body        - Notification body
 * @param {object} data        - Data to pass along (e.g., { orderId: '...' })
 */
const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid Expo push token: ${pushToken}`);
    return;
  }

  const messages = [
    {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    },
  ];

  try {
    const tickets = await expo.sendPushNotificationsAsync(messages);
    console.log('Push notification ticket:', tickets);
  } catch (error) {
    console.error('Push notification error:', error);
  }
};

module.exports = { sendPushNotification };