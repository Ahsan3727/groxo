const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { emitToOrder, emitToRole, emitToUser } = require('../services/socketService');
const { sendNotification } = require('../services/notificationService');

exports.createOrder = async (req, res, next) => {
  try {
    const { wholesalerId, items, deliveryAddress, paymentMethod } = req.body;
    // Validate and calculate total
    let totalAmount = 0;
    const orderItems = [];
    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ message: `Product ${product?.name || item.product} insufficient stock` });
      }
      orderItems.push({ product: product._id, quantity: item.quantity, price: product.price });
      totalAmount += product.price * item.quantity;
    }

    const order = new Order({
      customer: req.user._id,
      wholesaler: wholesalerId,
      items: orderItems,
      deliveryAddress,
      payment: { method: paymentMethod, amount: totalAmount },
      timeline: [{ status: 'pending' }]
    });
    await order.save();

    // Reduce stock
    for (let item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    // Notify wholesaler
    emitToUser(wholesalerId, 'new_order', order);
    sendNotification(await User.findById(wholesalerId), 'order_new', 'New Order', `Order ${order._id} received`);

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') filter.customer = req.user._id;
    else if (req.user.role === 'rider') filter.rider = req.user._id;
    else if (req.user.role === 'wholesaler') filter.wholesaler = req.user._id;
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter).populate('customer rider wholesaler').sort('-createdAt');
    res.json(orders);
  } catch (err) {
    next(err);
  }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer rider wholesaler');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, riderId, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['packing', 'cancelled'],
      packing: ['ready_for_pickup'],
      ready_for_pickup: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: []
    };

    if (!allowedTransitions[order.status]?.includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    if (status === 'out_for_delivery' && riderId) {
      order.rider = riderId;
    }

    order.status = status;
    order.timeline.push({ status, note });

    if (status === 'delivered') {
      order.payment.status = 'paid';
      // Add earnings to rider and wholesaler (simplified)
    }

    await order.save();

    emitToOrder(order._id, 'order_status_changed', { status, order });
    // Notify relevant users based on status

    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled now' });
    }
    order.status = 'cancelled';
    order.cancellationReason = reason;
    order.timeline.push({ status: 'cancelled', note: reason });
    await order.save();
    // Refund logic if payment done
    emitToOrder(order._id, 'order_status_changed', { status: 'cancelled', order });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.assignRider = async (req, res, next) => {
  try {
    const { riderId } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { rider: riderId, status: 'out_for_delivery' }, { new: true });
    emitToUser(riderId, 'order_assigned', order);
    res.json(order);
  } catch (err) {
    next(err);
  }
};
