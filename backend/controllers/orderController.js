const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const sendPushNotification = require('../utils/sendPushNotification');

// ---------- Utility: Emit real-time event ----------
const emitOrderUpdate = (req, order) => {
  const io = req.app.get('io');
  if (io) {
    io.emit('orderUpdated', order);
    if (order.customer) io.to(order.customer.toString()).emit('orderUpdated', order);
    if (order.rider) io.to(order.rider.toString()).emit('orderUpdated', order);
    if (order.wholesaler) io.to(order.wholesaler.toString()).emit('orderUpdated', order);
  }
};

// ---------- Utility: Unique order number ----------
const generateOrderNumber = async () => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${datePart}-${random}`;
  const exists = await Order.findOne({ orderNumber });
  if (exists) return generateOrderNumber();
  return orderNumber;
};

// ---------- CREATE ORDER ----------
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, payment } = req.body;
    console.log('Create order request received:', JSON.stringify(req.body));

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    let totalAmount = 0;
    const orderItems = [];
    let wholesalerId = null;

    for (const item of items) {
      console.log('Looking up product:', item.product);
      const product = await Product.findById(item.product);
      if (!product) {
        console.log('Product not found:', item.product);
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (!product.isApproved) {
        console.log('Product not approved:', product.name);
        return res.status(400).json({ message: `${product.name} is not approved yet` });
      }

      const price = product.adminPrice || product.price;
      orderItems.push({
        product: product._id,
        quantity: item.quantity || 1,
        price: price,
      });
      totalAmount += price * (item.quantity || 1);

      if (!wholesalerId && product.wholesaler) {
        wholesalerId = product.wholesaler;
        console.log('Wholesaler set from product:', wholesalerId);
      }
    }

    if (!wholesalerId) {
      console.log('No wholesaler found for order items');
      return res.status(400).json({ message: 'Could not determine wholesaler from products' });
    }

    const orderNumber = await generateOrderNumber();
    console.log('Generated orderNumber:', orderNumber);

    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      wholesaler: wholesalerId,
      items: orderItems,
      deliveryAddress: deliveryAddress || {},
      payment: {
        method: payment?.method || 'cod',
        amount: totalAmount,
        status: 'pending',
      },
      status: 'pending',
      packingStatus: 'pending',
      confirmedByAdmin: false,
      timeline: [{ status: 'pending', timestamp: new Date(), note: 'Order placed' }],
    });

    console.log('Order created:', order._id);

    await order.populate(['customer', 'wholesaler', 'items.product']);

    // ---------- Push notification to wholesaler ----------
    try {
      const wholesalerUser = await User.findById(wholesalerId).select('expoPushToken');
      if (wholesalerUser && wholesalerUser.expoPushToken) {
        sendPushNotification(
          wholesalerUser.expoPushToken,
          'New Order Received!',
          `You have a new order #${order.orderNumber}. Tap to view.`,
          { type: 'new_order', orderId: order._id.toString() }
        );
      }
    } catch (notifErr) {
      console.error('Wholesaler push notification failed:', notifErr.message);
    }

    // ---------- Emit socket events ----------
    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', order);                  // general broadcast
      io.to('riders').emit('newAvailableOrder', order); // notify all online riders
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('CREATE ORDER ERROR:', error.message);
    console.error('FULL ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET ORDERS (role-based) ----------
exports.getOrders = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'rider') {
      filter.rider = req.user._id;
    } else if (req.user.role === 'wholesaler') {
      filter.wholesaler = req.user._id;
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('wholesaler', 'name storeName')
      .populate('rider', 'name phone vehicle')
      .populate('items.product', 'name price image')
      .sort('-createdAt');

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET SINGLE ORDER ----------
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('wholesaler', 'name storeName phone')
      .populate('rider', 'name phone vehicle currentLocation')
      .populate('items.product', 'name price image');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role !== 'admin') {
      const isOwner =
        order.customer?._id?.toString() === req.user._id.toString() ||
        order.rider?._id?.toString() === req.user._id.toString() ||
        order.wholesaler?._id?.toString() === req.user._id.toString();
      if (!isOwner) return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- UPDATE ORDER STATUS ----------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, riderLocation } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Allowed transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['packing', 'out_for_delivery', 'cancelled'], // ← rider can skip packing
      packing: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'disputed'],
      delivered: ['disputed'],
      cancelled: [],
      disputed: [],
    };

    // Special rule: rider can go directly from 'confirmed' to 'out_for_delivery'
    // ONLY if the rider is already assigned to this order
    if (status === 'out_for_delivery' && order.status === 'confirmed') {
      if (req.user.role === 'admin' || String(order.rider) === String(req.user._id)) {
        // allowed
      } else {
        return res.status(403).json({ message: 'Only the assigned rider can skip packing' });
      }
    }

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from '${order.status}' to '${status}'`,
      });
    }

    if (req.body.rider) {
      order.rider = req.body.rider;
    }

    if (status === 'out_for_delivery' && riderLocation) {
      order.pickupLocation = riderLocation;
    }
    if (riderLocation) {
      order.riderLocation = riderLocation;
    }

    order.status = status;
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status changed to ${status}`,
    });

    if (status === 'cancelled' && req.body.reason) {
      order.cancellationReason = req.body.reason;
    }

    await order.save();
    await order.populate(['customer', 'wholesaler', 'rider', 'items.product']);

    // Push notifications for status changes
    if (order.customer) {
      sendPushNotification(
        order.customer,
        'Order Update',
        `Your order is now ${status.replace(/_/g, ' ')}`,
        { orderId: order._id.toString(), status }
      );
    }

    if (status === 'confirmed' && order.rider) {
      sendPushNotification(
        order.rider,
        'New Delivery',
        'You have been assigned a new order!',
        { orderId: order._id.toString() }
      );
    }

    if (status === 'pending' && order.wholesaler) {
      sendPushNotification(
        order.wholesaler,
        'New Order',
        'A new order is waiting for you!',
        { orderId: order._id.toString() }
      );
    }

    emitOrderUpdate(req, order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- ADMIN: ASSIGN RIDER ----------
exports.assignRider = async (req, res) => {
  try {
    const { riderId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const rider = await User.findById(riderId);
    if (!rider || rider.role !== 'rider') {
      return res.status(400).json({ message: 'Invalid rider' });
    }

    order.rider = riderId;
    order.status = 'confirmed';
    order.timeline.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: `Assigned to rider ${rider.name}`,
    });

    await order.save();
    await order.populate(['customer', 'wholesaler', 'rider', 'items.product']);

    if (rider.expoPushToken) {
      sendPushNotification(
        rider.expoPushToken,
        'New Delivery',
        'You have been assigned a new order!',
        { orderId: order._id.toString() }
      );
    }

    emitOrderUpdate(req, order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};