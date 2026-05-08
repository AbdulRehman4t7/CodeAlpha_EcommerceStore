const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || `http://localhost:${PORT}`;
let dbReady = false;

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '..', 'client', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('/api/db-status', (req, res) => {
  res.status(dbReady ? 200 : 503).json({
    connected: dbReady,
    message: dbReady ? 'MongoDB connected' : 'MongoDB is not connected. Start MongoDB or set MONGO_URI in .env.'
  });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/db-status') return next();
  if (!dbReady) {
    return res.status(503).json({
      message: 'MongoDB is not connected. Start MongoDB, run npm run seed, then refresh the page.'
    });
  }
  return next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'CodeAlpha E-commerce Store' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codealpha_ecommerce', {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    dbReady = true;
    console.log('MongoDB connected');
  })
  .catch((error) => {
    dbReady = false;
    console.error('MongoDB connection failed:', error.message);
    console.error('Install/start MongoDB locally or use a MongoDB Atlas URI in .env, then restart npm run dev.');
  });
