const express = require('express');
const router = express.Router();
const {
  getReturns,
  getReturn,
  createReturn,
  updateReturn,
  deleteReturn,
  getOrderReturns,
  getReturnStats
} = require('../controllers/returnController');

// Special routes
router.get('/stats/overview', getReturnStats);
router.get('/order/:orderId', getOrderReturns);

// Main CRUD routes
router.route('/')
  .get(getReturns)
  .post(createReturn);

router.route('/:id')
  .get(getReturn)
  .put(updateReturn)
  .delete(deleteReturn);

module.exports = router;
