const express = require('express');
const { getCart, addItem, updateItem, removeItem } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getCart);
router.post('/add', addItem);
router.put('/update', updateItem);
router.delete('/remove/:productId', removeItem);

module.exports = router;
