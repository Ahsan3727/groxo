module.exports = {
  createOrder: (req, res) => res.json({ message: 'Order created' }),
  getOrders: (req, res) => res.json({ message: 'Order list' }),
  getOrder: (req, res) => res.json({ message: 'Order detail' }),
  updateOrderStatus: (req, res) => res.json({ message: 'Order status updated' })
};
