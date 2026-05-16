const Product = require('../models/Product');
const { emitToRole } = require('../services/socketService');

exports.createProduct = async (req, res, next) => {
  try {
    const product = new Product({ ...req.body, wholesaler: req.user._id });
    await product.save();
    emitToRole('admin', 'product_approval_needed', product);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const filter = { isApproved: true, isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.wholesaler) filter.wholesaler = req.query.wholesaler;
    const products = await Product.find(filter).populate('wholesaler', 'shopName');
    res.json(products);
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('wholesaler', 'shopName');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate({ _id: req.params.id, wholesaler: req.user._id }, req.body, { new: true });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, wholesaler: req.user._id });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

exports.approveProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.getPendingProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isApproved: false }).populate('wholesaler', 'shopName');
    res.json(products);
  } catch (err) {
    next(err);
  }
};
