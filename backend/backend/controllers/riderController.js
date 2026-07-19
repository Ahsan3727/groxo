module.exports = {
  getRiders: (req, res) => res.json({ message: 'Rider list' }),
  getRider: (req, res) => res.json({ message: 'Rider detail' }),
  updateRider: (req, res) => res.json({ message: 'Rider updated' })
};
