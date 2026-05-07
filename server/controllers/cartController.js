const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const populateCart = (cart) => cart.populate('items.product');

const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body;
    const quantity = Number(qty);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      res.status(400);
      throw new Error('Valid productId and quantity are required');
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    if (product.stock < quantity) {
      res.status(400);
      throw new Error('Requested quantity exceeds stock');
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((entry) => entry.product.toString() === productId);
    if (item) item.qty = Math.min(item.qty + quantity, product.stock);
    else cart.items.push({ product: productId, qty: quantity });
    await cart.save();
    res.status(201).json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    const quantity = Number(qty);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      res.status(400);
      throw new Error('Valid productId and quantity are required');
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    if (quantity > product.stock) {
      res.status(400);
      throw new Error('Requested quantity exceeds stock');
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((entry) => entry.product.toString() === productId);
    if (!item) {
      res.status(404);
      throw new Error('Product is not in cart');
    }
    item.qty = quantity;
    await cart.save();
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((entry) => entry.product.toString() !== req.params.productId);
    await cart.save();
    res.json(await populateCart(cart));
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addItem, updateItem, removeItem };
