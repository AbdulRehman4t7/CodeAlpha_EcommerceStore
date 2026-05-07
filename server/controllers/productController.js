const Product = require('../models/Product');

const parseImages = (files, bodyImages) => {
  const uploaded = (files || []).map((file) => `/uploads/${file.filename}`);
  const existing = Array.isArray(bodyImages)
    ? bodyImages
    : String(bodyImages || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  return [...existing, ...uploaded];
};

const productPayload = (body, files, fallbackImages = []) => {
  const images = parseImages(files, body.images);
  return {
    name: body.name,
    description: body.description,
    price: Number(body.price),
    category: body.category,
    stock: Number(body.stock),
    images: images.length ? images : fallbackImages
  };
};

const validateProduct = (payload) => {
  if (!payload.name || !payload.description || !payload.category) {
    return 'Name, description, and category are required';
  }
  if (!Number.isFinite(payload.price) || payload.price < 0) return 'Price must be a positive number';
  if (!Number.isInteger(payload.stock) || payload.stock < 0) return 'Stock must be a positive whole number';
  if (!payload.images.length) return 'At least one product image is required';
  return null;
};

const getProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, sort = 'newest', page = 1, limit = 12 } = req.query;
    const query = {};

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortMap = {
      newest: { createdAt: -1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      rating: { 'ratings.rating': -1 }
    };
    const currentPage = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 48);
    const skip = (currentPage - 1) * pageSize;

    const [products, total, categories] = await Promise.all([
      Product.find(query).sort(sortMap[sort] || sortMap.newest).skip(skip).limit(pageSize),
      Product.countDocuments(query),
      Product.distinct('category')
    ]);

    res.json({
      products,
      categories,
      page: currentPage,
      pages: Math.ceil(total / pageSize) || 1,
      total
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category
    }).limit(4);
    res.json({ product, related });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const payload = productPayload(req.body, req.files);
    const validationError = validateProduct(payload);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }
    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    const payload = productPayload(req.body, req.files, product.images);
    const validationError = validateProduct(payload);
    if (validationError) {
      res.status(400);
      throw new Error(validationError);
    }

    Object.assign(product, payload);
    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
