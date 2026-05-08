const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, upload.array('productImages', 5), createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, upload.array('productImages', 5), updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;
