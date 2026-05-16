// Firebase push notification helper (placeholder)
const sendPush = async (token, title, body, data = {}) => {
  // TODO: implement Firebase Admin SDK
  console.log(`Push sent to ${token}: ${title} - ${body}`);
};
module.exports = { sendPush };
