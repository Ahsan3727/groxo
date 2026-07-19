const RiderLocation = require('../models/RiderLocation');

exports.updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, isOnline } = req.body;
    const riderId = req.user._id;
    const location = await RiderLocation.findOneAndUpdate(
      { rider: riderId },
      { location: { type: 'Point', coordinates: [lng, lat] }, isOnline, lastUpdated: new Date() },
      { upsert: true, new: true }
    );
    // Emit to admin and customer tracking
    const io = req.app.get('io'); // or access through socket service
    if (io) {
      io.to('admin').emit('rider_location_update', { riderId, lat, lng });
      // emit to order's customer if order assigned
    }
    res.json(location);
  } catch (err) {
    next(err);
  }
};

exports.getRiderLocation = async (req, res, next) => {
  try {
    const location = await RiderLocation.findOne({ rider: req.params.riderId });
    res.json(location);
  } catch (err) {
    next(err);
  }
};
