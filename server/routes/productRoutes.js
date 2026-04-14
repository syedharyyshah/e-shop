const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getInventoryStats
} = require('../controllers/productController');

// Special routes (must come before /:id)
router.get('/low-stock', getLowStockProducts);
router.get('/stats/inventory', getInventoryStats);

// Main CRUD routes
router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
