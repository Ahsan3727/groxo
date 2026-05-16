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

    // Location tracking for riders
    socket.on('update_location', (data) => {
      if (socket.user.role !== 'rider') return;
      // data: { lat, lng }
      // Update in DB via controller or directly
      const RiderLocation = require('../models/RiderLocation');
      RiderLocation.findOneAndUpdate(
        { rider: socket.user._id },
        { location: { type: 'Point', coordinates: [data.lng, data.lat] }, lastUpdated: new Date() },
        { upsert: true, new: true }
      ).then(loc => {
        io.to('admin').emit('rider_location_update', { riderId: socket.user._id, lat: data.lat, lng: data.lng });
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
