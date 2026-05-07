const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

dotenv.config();

const products = [
  {
    name: 'Aurora Wireless Headphones',
    description: 'Active noise cancellation, 40-hour battery life, memory foam ear cups, and studio-grade sound tuned for daily listening.',
    price: 129.99,
    category: 'Electronics',
    stock: 24,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'],
    ratings: [{ rating: 5, comment: 'Excellent sound and battery life.' }, { rating: 4, comment: 'Comfortable for workdays.' }]
  },
  {
    name: 'Metro Smart Watch',
    description: 'Fitness tracking, sleep insights, heart-rate monitoring, waterproof design, and a crisp always-on display.',
    price: 179.5,
    category: 'Electronics',
    stock: 18,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'],
    ratings: [{ rating: 4, comment: 'Reliable and polished.' }]
  },
  {
    name: 'Nomad Canvas Backpack',
    description: 'Weather-resistant canvas backpack with padded laptop storage, quick-access pockets, and premium hardware.',
    price: 74.99,
    category: 'Fashion',
    stock: 36,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80'],
    ratings: [{ rating: 5, comment: 'Looks sharp and holds everything.' }]
  },
  {
    name: 'Linen Everyday Shirt',
    description: 'Breathable linen blend shirt with a relaxed fit, reinforced seams, and office-to-weekend styling.',
    price: 46.0,
    category: 'Fashion',
    stock: 42,
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80'],
    ratings: [{ rating: 4, comment: 'Great fabric for warm weather.' }]
  },
  {
    name: 'Ceramic Pour Over Set',
    description: 'Minimal ceramic dripper, glass server, stainless scoop, and filters for precise slow coffee brewing.',
    price: 58.75,
    category: 'Home',
    stock: 20,
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80'],
    ratings: [{ rating: 5, comment: 'Makes mornings better.' }]
  },
  {
    name: 'Oak Desk Organizer',
    description: 'Solid oak organizer with cable channel, pen tray, phone stand, and clean modular sections.',
    price: 39.99,
    category: 'Home',
    stock: 30,
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80'],
    ratings: [{ rating: 4, comment: 'Keeps the desk tidy.' }]
  },
  {
    name: 'Stride Running Shoes',
    description: 'Lightweight running shoes with responsive foam, breathable mesh, and durable road-grip outsole.',
    price: 112.0,
    category: 'Sports',
    stock: 28,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'],
    ratings: [{ rating: 5, comment: 'Fast and comfortable.' }, { rating: 5, comment: 'Great for training.' }]
  },
  {
    name: 'Hydro Steel Bottle',
    description: 'Double-wall insulated bottle that keeps drinks cold for 24 hours with a leakproof carry lid.',
    price: 28.99,
    category: 'Sports',
    stock: 55,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80'],
    ratings: [{ rating: 4, comment: 'Solid daily bottle.' }]
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codealpha_ecommerce');
    await Promise.all([User.deleteMany(), Product.deleteMany(), Cart.deleteMany(), Order.deleteMany()]);

    const [admin, user] = await User.create([
      { name: 'CodeAlpha Admin', email: 'admin@codealpha.dev', password: 'Admin123!', role: 'admin' },
      { name: 'CodeAlpha User', email: 'user@codealpha.dev', password: 'User123!', role: 'user' }
    ]);

    const seededProducts = await Product.insertMany(
      products.map((product) => ({
        ...product,
        ratings: product.ratings.map((rating) => ({ ...rating, user: user._id }))
      }))
    );

    await Cart.create({
      user: user._id,
      items: [
        { product: seededProducts[0]._id, qty: 1 },
        { product: seededProducts[4]._id, qty: 2 }
      ]
    });

    console.log(`Seeded ${seededProducts.length} products, admin ${admin.email}, and user ${user.email}`);
    await mongoose.disconnect();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

seed();
