module.exports = {
  getWholesalers: (req, res) => res.json({ message: 'Wholesaler list' }),
  getWholesaler: (req, res) => res.json({ message: 'Wholesaler detail' }),
  updateWholesaler: (req, res) => res.json({ message: 'Wholesaler updated' })
};
