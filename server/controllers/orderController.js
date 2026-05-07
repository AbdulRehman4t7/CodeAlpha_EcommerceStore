const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

const TAX_RATE = Number(process.env.TAX_RATE || 0.08);

const validateAddress = (address = {}) => {
  const required = ['fullName', 'phone', 'address', 'city', 'postalCode', 'country'];
  return required.every((key) => String(address[key] || '').trim().length > 1);
};

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;
    if (!validateAddress(shippingAddress)) {
      res.status(400);
      throw new Error('Complete shipping address is required');
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || !cart.items.length) {
      res.status(400);
      throw new Error('Cart is empty');
    }

    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = item.product;
      if (!product || product.stock < item.qty) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product ? product.name : 'an item'}`);
      }
      subtotal += product.price * item.qty;
      orderItems.push({
        product: product._id,
        name: product.name,
        qty: item.qty,
        price: product.price,
        image: product.images[0]
      });
    }

    const totalAmount = Number((subtotal + subtotal * TAX_RATE).toFixed(2));
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount
    });

    await Promise.all(
      cart.items.map((item) =>
        Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.qty } })
      )
    );
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const allOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const { status } = req.body;
    if (!statuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid order status');
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, myOrders, allOrders, updateStatus };
