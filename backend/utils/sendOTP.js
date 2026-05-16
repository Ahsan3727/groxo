/**
 * Sends OTP to a phone number.
 * Currently logs OTP to console for development.
 * Replace with actual SMS provider (Twilio, MSG91, etc.) when ready.
 *
 * @param {string} phone - Phone number with country code (e.g., "+919876543210")
 * @param {string} otp - The generated OTP
 * @returns {Promise<boolean>} - Resolves true if sent successfully
 */
const sendOTP = async (phone, otp) => {
  // ========== DEVELOPMENT MODE ==========
  console.log(`📱 OTP for ${phone}: ${otp}`);
  return true; // Always succeeds in dev

  // ========== PRODUCTION EXAMPLE (Twilio) ==========
  // const client = require('twilio')(accountSid, authToken);
  // await client.messages.create({
  //   body: `Your Groxo verification code is: ${otp}`,
  //   from: '+1234567890',
  //   to: phone
  // });
  // return true;
};

module.exports = sendOTP;