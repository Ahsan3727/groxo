const ChatMessage = require('../models/ChatMessage');

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, orderId, message } = req.body;
    const chat = new ChatMessage({ sender: req.user._id, receiver: receiverId, order: orderId, message });
    await chat.save();
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
    const messages = await ChatMessage.find(filter).sort('createdAt');
    res.json(messages);
  } catch (err) {
    next(err);
  }
};
