const ChatMessage = require('../models/ChatMessage');

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, orderId, message } = req.body;
    const chat = new ChatMessage({ sender: req.user._id, receiver: receiverId, order: orderId, message });
    await chat.save();
    // server.js joins every socket to a room named plain `userId` (from
    // socket.handshake.query.userId) — this was emitting to `user_${id}`
    // instead, which no socket is ever actually in, so messages never
    // arrived in real time even after the client-side socket URL is fixed.
    const io = req.app.get('io');
    if (io) io.to(receiverId.toString()).emit('new_chat_message', chat);
    res.status(201).json(chat);
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { orderId, userId } = req.query;
    const filter = {};
    if (orderId) filter.order = orderId;
    if (userId) {
      filter.$or = [{ sender: req.user._id, receiver: userId }, { sender: userId, receiver: req.user._id }];
    }
    const messages = await ChatMessage.find(filter)
      .populate('sender', 'name role')
      .populate('receiver', 'name role')
      .sort('createdAt');
    res.json(messages);
  } catch (err) {
    next(err);
  }
};
