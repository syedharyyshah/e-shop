const mongoose = require('mongoose');

const invoiceLoanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    match: [/^0[0-9]{10}$/, 'Please enter valid Pakistani phone number (03XXXXXXXXX)']
  },
  customerCNIC: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{13}$/, 'Please enter valid 13-digit CNIC number']
  },
  customerAddress: {
    type: String,
    required: true,
    trim: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: true,
    min: 0
  },
  dateGiven: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String
    }
  }]
}, { timestamps: true });

// Index for search performance
invoiceLoanSchema.index({ customerName: 'text', customerPhone: 'text', customerCNIC: 'text' });
invoiceLoanSchema.index({ userId: 1 });
invoiceLoanSchema.index({ status: 1 });
invoiceLoanSchema.index({ orderId: 1 });

module.exports = mongoose.model('InvoiceLoan', invoiceLoanSchema);
