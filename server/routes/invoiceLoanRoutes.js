const express = require('express');
const router = express.Router();
const {
  getInvoiceLoans,
  getInvoiceLoan,
  createInvoiceLoan,
  addPayment,
  updateInvoiceLoan,
  deleteInvoiceLoan,
  getInvoiceLoanStats,
  getUniqueCustomers
} = require('../controllers/invoiceLoanController');

router.route('/')
  .get(getInvoiceLoans)
  .post(createInvoiceLoan);

router.route('/customers')
  .get(getUniqueCustomers);

router.route('/stats/overview')
  .get(getInvoiceLoanStats);

router.route('/:id')
  .get(getInvoiceLoan)
  .put(updateInvoiceLoan)
  .delete(deleteInvoiceLoan);

router.route('/:id/payment')
  .put(addPayment);

module.exports = router;
