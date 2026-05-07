const express = require('express');
const { createOrder, myOrders, allOrders, updateStatus } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/myorders', protect, myOrders);
router.get('/', protect, admin, allOrders);
router.put('/:id/status', protect, admin, updateStatus);

module.exports = router;
