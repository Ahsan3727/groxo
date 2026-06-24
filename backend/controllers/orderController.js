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
    // Notify each wholesaler in groups
    if (order.wholesalerGroups) {
      order.wholesalerGroups.forEach(group => {
        if (group.wholesaler) {
          io.to(group.wholesaler.toString()).emit('orderUpdated', order);
        }
      });
    }
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

// ---------- CREATE ORDER (now uses wholesalerGroups) ----------
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, payment } = req.body;
    console.log('Create order request received:', JSON.stringify(req.body));

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const productIds = items.map(i => i.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== productIds.length) {
      return res.status(404).json({ message: 'One or more products not found' });
    }

    const unapproved = products.filter(p => !p.isApproved);
    if (unapproved.length > 0) {
      return res.status(400).json({
        message: `Product(s) not approved: ${unapproved.map(p => p.name).join(', ')}`,
      });
    }

    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    // Group items by wholesaler
    const groupMap = {};
    let totalAmount = 0;
    const allItems = [];

    for (const item of items) {
      const product = productMap[item.product.toString()];
      const price = product.adminPrice || product.price;
      const qty = item.quantity || 1;
      totalAmount += price * qty;

      allItems.push({
        product: product._id,
        quantity: qty,
        price,
      });

      const wid = product.wholesaler.toString();
      if (!groupMap[wid]) {
        groupMap[wid] = {
          wholesaler: product.wholesaler,
          storeName: product.wholesaler.name,   // ← use name, not storeName
          items: [],
        };
      }
      groupMap[wid].items.push({
        product: product._id,
        quantity: qty,
        price,
      });
    }

    const wholesalerGroups = Object.values(groupMap);
    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      customer: req.user._id,
      items: allItems,
      wholesalerGroups,
      deliveryAddress: deliveryAddress || {},
      payment: {
        method: payment?.method || 'cod',
        amount: totalAmount,
        status: 'pending',
      },
      status: 'confirmed',
      packingStatus: 'pending',
      confirmedByAdmin: true,
      timeline: [{ status: 'confirmed', timestamp: new Date(), note: 'Order placed and confirmed' }],
    });

    console.log('Order created:', order._id);

    await order.populate('customer');
    await order.populate('wholesalerGroups.wholesaler', 'storeName name');
    await order.populate('items.product', 'name price');

    // Notify each wholesaler
    for (const group of wholesalerGroups) {
      const wholesalerUser = await User.findById(group.wholesaler).select('expoPushToken');
      if (wholesalerUser?.expoPushToken) {
        sendPushNotification(
          wholesalerUser.expoPushToken,
          'New Order Received!',
          `You have a new order #${order.orderNumber}. Tap to view.`,
          { type: 'new_order', orderId: order._id.toString() }
        );
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('orderUpdated', order);
      io.to('riders').emit('newAvailableOrder', order);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('CREATE ORDER ERROR:', error.message);
    console.error('FULL ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET ORDERS (role-based, with group expansion for wholesaler) ----------
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
      // Match both old single‑wholesaler and new groups
      filter.$or = [
        { wholesaler: req.user._id },
        { 'wholesalerGroups.wholesaler': req.user._id },
      ];
    }

    let orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('wholesaler', 'name storeName')
      .populate('wholesalerGroups.wholesaler', 'name storeName')
      .populate('wholesalerGroups.items.product', 'name price')   // ✅ already present
      .populate('rider', 'name phone vehicle')
      .populate('items.product', 'name price image')
      .sort('-createdAt');

    // For wholesaler: expand each matching group into a separate order object
    if (req.user.role === 'wholesaler') {
      const expanded = [];
      for (const order of orders) {
        // Old single‑wholesaler order → keep as is
        if (!order.wholesalerGroups || order.wholesalerGroups.length === 0) {
          expanded.push(order);
          continue;
        }

        // New group‑based order → push one order per matching group
        for (const group of order.wholesalerGroups) {
          if (group.wholesaler._id.toString() === req.user._id.toString()) {
            expanded.push({
              _id: order._id,
              orderNumber: order.orderNumber,
              customer: order.customer,
              rider: order.rider,
              deliveryAddress: order.deliveryAddress,
              status: group.status,                        // use group status
              payment: {
                ...order.payment,
                amount: group.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
              },
              timeline: order.timeline,
              // ✅ FIX: Convert each subdocument to a plain object so product names are retained
              items: group.items.map(item => item.toObject()),
              groupStatus: group.status,
              groupPaid: group.paid,
              groupIndex: order.wholesalerGroups.indexOf(group),
              fullOrderId: order._id,
              storeName: group.storeName,
              packingStatus: group.status,                 // mimic old packingStatus
              wholesalerPaid: group.paid,
              wholesaler: group.wholesaler,                // for old‑style compatibility
            });
          }
        }
      }
      return res.json(expanded);
    }

    res.json(orders);
  } catch (error) {
    console.error('GET ORDERS ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ---------- GET SINGLE ORDER ----------
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('wholesaler', 'name storeName phone')
      .populate('wholesalerGroups.wholesaler', 'name storeName phone')
      .populate('rider', 'name phone vehicle currentLocation')
      .populate('items.product', 'name price image');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role !== 'admin') {
      const isOwner =
        order.customer?._id?.toString() === req.user._id.toString() ||
        order.rider?._id?.toString() === req.user._id.toString() ||
        (order.wholesaler && order.wholesaler._id?.toString() === req.user._id.toString()) ||
        (order.wholesalerGroups && order.wholesalerGroups.some(
          g => g.wholesaler._id?.toString() === req.user._id.toString()
        ));
      if (!isOwner) return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- UPDATE ORDER STATUS (unchanged) ----------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, riderLocation } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['packing', 'out_for_delivery', 'cancelled'],
      packing: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'disputed'],
      delivered: ['disputed'],
      cancelled: [],
      disputed: [],
    };

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

    if (req.body.rider) order.rider = req.body.rider;
    if (status === 'out_for_delivery' && riderLocation) order.pickupLocation = riderLocation;
    if (riderLocation) order.riderLocation = riderLocation;

    order.status = status;
    order.timeline.push({
      status,
      timestamp: new Date(),
      note: note || `Status changed to ${status}`,
    });
    if (status === 'cancelled' && req.body.reason) order.cancellationReason = req.body.reason;

    await order.save();
    await order.populate(['customer', 'wholesaler', 'wholesalerGroups.wholesaler', 'rider', 'items.product']);

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

    // Notify each wholesaler (old + new)
    if (order.wholesaler) {
      sendPushNotification(
        order.wholesaler,
        'Order Update',
        `An order containing your products is now ${status.replace(/_/g, ' ')}.`,
        { orderId: order._id.toString() }
      );
    }
    if (order.wholesalerGroups) {
      for (const group of order.wholesalerGroups) {
        sendPushNotification(
          group.wholesaler,
          'Order Update',
          `An order containing your products is now ${status.replace(/_/g, ' ')}.`,
          { orderId: order._id.toString() }
        );
      }
    }

    emitOrderUpdate(req, order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------- ADMIN: ASSIGN RIDER (unchanged) ----------
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
    await order.populate(['customer', 'wholesaler', 'wholesalerGroups.wholesaler', 'rider', 'items.product']);

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

// ---------- UPDATE WHOLESALER GROUP STATUS (new) ----------
exports.updateGroupStatus = async (req, res) => {
  try {
    const { orderId, groupIndex, status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (!order.wholesalerGroups || order.wholesalerGroups.length === 0) {
      return res.status(400).json({ message: 'This order does not use wholesaler groups' });
    }
    if (groupIndex < 0 || groupIndex >= order.wholesalerGroups.length) {
      return res.status(400).json({ message: 'Invalid group index' });
    }

    const group = order.wholesalerGroups[groupIndex];
    group.status = status;
    if (status === 'ready_for_pickup') group.packedAt = new Date();

    // Update overall order status based on all groups
    const allReady = order.wholesalerGroups.every(g => g.status === 'ready_for_pickup');
    order.status = allReady ? 'ready_for_pickup' : 'packing';

    await order.save();
    await order.populate(['customer', 'wholesalerGroups.wholesaler', 'rider', 'items.product']);
    emitOrderUpdate(req, order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};