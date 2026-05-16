const SupportTicket = require('../models/SupportTicket');

exports.createTicket = async (req, res, next) => {
  try {
    const ticket = new SupportTicket({ user: req.user._id, ...req.body });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
};

exports.getTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find().populate('user assignedTo');
    res.json(tickets);
  } catch (err) {
    next(err);
  }
};

exports.addReply = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, {
      $push: { replies: { sender: req.user._id, message: req.body.message } }
    }, { new: true });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
};
