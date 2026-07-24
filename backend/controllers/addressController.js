const Address = require('../models/Address');

// GET /api/users/addresses
// Returns a bare array (matches the convention already used correctly by
// GET /orders — see OrdersScreen.js) so the frontend never has to guess
// between `res.data` and `res.data.addresses`.
exports.list = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
};

// POST /api/users/addresses
// Body shape sent today by AddAddressScreen.js: { label, line1, city, pincode }
// lat/lng are optional (not currently collected by that screen, but accepted
// here so a future map-pick UI can send them without another backend change).
exports.create = async (req, res, next) => {
  try {
    const { label, line1, city, pincode, lat, lng, isDefault } = req.body;

    if (!line1 || !city) {
      return res.status(400).json({ message: 'line1 and city are required' });
    }

    // First address a user saves becomes the default automatically, so
    // AddressListScreen/OrderMapPicker always have a sane default to preselect.
    const existingCount = await Address.countDocuments({ user: req.user._id });
    const shouldBeDefault = isDefault === true || existingCount === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    }

    const address = await Address.create({
      user: req.user._id,
      label,
      line1,
      city,
      pincode,
      lat,
      lng,
      isDefault: shouldBeDefault,
    });

    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/addresses/:id
exports.update = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: 'Address not found' });

    const { label, line1, city, pincode, lat, lng } = req.body;
    if (label !== undefined) address.label = label;
    if (line1 !== undefined) address.line1 = line1;
    if (city !== undefined) address.city = city;
    if (pincode !== undefined) address.pincode = pincode;
    if (lat !== undefined) address.lat = lat;
    if (lng !== undefined) address.lng = lng;

    await address.save();
    res.json(address);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/addresses/:id
exports.remove = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: 'Address not found' });

    // If the deleted address was the default, promote the most recently
    // added remaining address so the customer always has a default set.
    if (address.isDefault) {
      const next = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.json({ message: 'Address deleted' });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/addresses/:id/default
exports.setDefault = async (req, res, next) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: 'Address not found' });

    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    address.isDefault = true;
    await address.save();

    res.json(address);
  } catch (err) {
    next(err);
  }
};
