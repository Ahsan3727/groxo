const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { setSocketInstance } = require('../services/socketService');

const setupSocket = (io) => {
  setSocketInstance(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error('No token');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) throw new Error('User not found');
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id} (${socket.user.role})`);

    // Join personal room
    socket.join(`user_${socket.user._id}`);
    // Join role-based room
    socket.join(`role_${socket.user.role}`);
    // Admins also join the 'admin' room — this is what rider location
    // pushes (below) broadcast to. Without this join, io.to('admin').emit(...)
    // reaches no one, silently.
    if (socket.user.role === 'admin') {
      socket.join('admin');
    }

    // Location tracking for riders
    socket.on('update_location', (data) => {
      if (socket.user.role !== 'rider') return;
      // data: { lat, lng }
      // Write to User.currentLocation — this is what GET /admin/riders/locations
      // and the Hub Map actually read. (The old RiderLocation collection was a
      // second, disconnected store that nothing else consulted, so a location
      // pushed here never showed up anywhere until the next REST poll re-read
      // stale data from the User document.)
      User.findByIdAndUpdate(socket.user._id, {
        currentLocation: { type: 'Point', coordinates: [data.lng, data.lat] },
        lastLocationUpdate: new Date(),
      }).then(() => {
        io.to('admin').emit('rider_location_update', {
          riderId: socket.user._id,
          lat: data.lat,
          lng: data.lng,
          lastLocationUpdate: new Date(),
        });
        // Broadcast to relevant order room if order is being tracked
        // socket.to(`order_${orderId}`).emit(...) - need order context
      });
    });

    // Join order room for real-time tracking
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`${socket.user._id} joined order room ${orderId}`);
    });

    socket.on('leave_order', (orderId) => {
      socket.leave(`order_${orderId}`);
    });

    // Chat messaging
    socket.on('chat_message', (data) => {
      // Save message
      const ChatMessage = require('../models/ChatMessage');
      ChatMessage.create({
        sender: socket.user._id,
        receiver: data.receiverId,
        order: data.orderId,
        message: data.message
      }).then(msg => {
        io.to(`user_${data.receiverId}`).emit('new_chat_message', msg);
        socket.emit('chat_message_sent', msg);
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
    });
  });
};

module.exports = { setupSocket };