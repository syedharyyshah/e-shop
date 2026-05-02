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
  getUniqueCustomers,
  addItemsToLoan,
  findExistingLoan
} = require('../controllers/invoiceLoanController');

router.route('/')
  .get(getInvoiceLoans)
  .post(createInvoiceLoan);

router.route('/find-existing')
  .get(findExistingLoan);

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

router.route('/:id/items')
  .put(addItemsToLoan);

module.exports = router;
