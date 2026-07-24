const User = require('../models/User');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, storeName, businessLicense, storeAddress } = req.body;
    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || 'customer',
      // These were previously dropped here even though SignupScreen sends
      // them and the User model has fields for them — a wholesaler's store
      // name/business license never actually got saved at signup.
      ...(role === 'wholesaler' && {
        storeName,
        businessLicense,
        storeAddress,
      }),
    });
    // If the user provided address coordinates, store them as currentLocation
if (req.body.address && req.body.address.lat && req.body.address.lng) {
  user.currentLocation = {
    type: 'Point',
    coordinates: [req.body.address.lng, req.body.address.lat],
  };
  user.lastLocationUpdate = new Date();
  await user.save();
}
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const user = await User.findOne({ $or: [{ email: email || '' }, { phone: phone || '' }] });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Update current user profile
exports.updateMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, phone, vehicle, storeName, businessLicense, storeAddress } = req.body;
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (vehicle) user.vehicle = vehicle;
    // These were previously silently ignored here — ProfileScreen.js sends
    // them and shows a "Saved" alert, but the backend never persisted the
    // change. Only relevant for wholesalers, but harmless to accept from
    // anyone who happens to send them.
    if (storeName !== undefined) user.storeName = storeName;
    if (businessLicense !== undefined) user.businessLicense = businessLicense;
    if (storeAddress !== undefined) user.storeAddress = storeAddress;

    const updated = await user.save();
    const response = updated.toObject();
    delete response.password;
    res.json(response);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ---------- Forgot / Reset / Change password ----------
// Screen 1's gap: there was no recovery path at all for a forgotten
// password. Implemented as a 6-digit OTP sent to email (if the account has
// one) or logged server-side for phone (via the existing sendOTP stub —
// wire in a real SMS provider there when ready). The OTP itself is never
// stored in plaintext, only its SHA-256 hash, and it expires after 10 min.
const crypto = require('crypto');
const { generateOTP } = require('../utils/otpHelper');
const { sendEmail } = require('../services/emailService');
const sendOTP = require('../utils/sendOTP');

const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

exports.forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    const user = await User.findOne({
      $or: [{ email: email || '__none__' }, { phone: phone || '__none__' }],
    });

    // Always respond with the same generic message whether or not the
    // account exists, so this endpoint can't be used to discover which
    // emails/phones are registered.
    const genericResponse = {
      message: 'If an account exists, a reset code has been sent.',
    };

    if (!user) return res.json(genericResponse);

    const otp = generateOTP();
    user.resetPasswordOTP = hashOTP(otp);
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    if (email && user.email) {
      try {
        await sendEmail(
          user.email,
          'Your Groxo password reset code',
          `<p>Your password reset code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
        );
      } catch (emailErr) {
        console.error('Failed to send reset email:', emailErr.message);
      }
    } else if (user.phone) {
      await sendOTP(user.phone, otp);
    }

    res.json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, phone, otp, newPassword } = req.body;
    if (!otp || !newPassword) {
      return res.status(400).json({ message: 'OTP and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      $or: [{ email: email || '__none__' }, { phone: phone || '__none__' }],
    }).select('+resetPasswordOTP +resetPasswordExpire');

    if (
      !user ||
      !user.resetPasswordOTP ||
      user.resetPasswordOTP !== hashOTP(otp) ||
      !user.resetPasswordExpire ||
      user.resetPasswordExpire < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    user.password = newPassword; // pre-save hook hashes it
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Change password for an already-logged-in user (Settings screen).
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};