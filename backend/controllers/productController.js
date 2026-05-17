module.exports = {
  getProducts: (req, res) => res.json({ message: 'Product list' }),
  getProduct: (req, res) => res.json({ message: 'Product detail' }),
  createProduct: (req, res) => res.json({ message: 'Product created' }),
  updateProduct: (req, res) => res.json({ message: 'Product updated' })
};
