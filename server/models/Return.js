const mongoose = require('mongoose');

const returnedItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitType: {
    type: String,
    enum: ['single', 'bulk'],
    default: 'single'
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  returnReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Return reason cannot exceed 500 characters'],
    default: null
  }
});

const returnSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  returnNumber: {
    type: String,
    required: [true, 'Return number is required'],
    unique: true,
    trim: true
  },
  // Customer Details (copied from order at time of return)
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true,
    default: '-'
  },
  // Return Items
  items: [returnedItemSchema],
  // Financial
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  // Return Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  // Return Type
  returnType: {
    type: String,
    enum: ['full', 'partial'],
    required: [true, 'Return type is required']
  },
  // Refund Details
  refundMethod: {
    type: String,
    enum: ['cash', 'original_payment', 'store_credit'],
    default: 'cash'
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  refundDate: {
    type: Date,
    default: null
  },
  // Additional Info
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: null
  },
  processedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for search performance
returnSchema.index({ returnNumber: 1 }, { unique: true });
returnSchema.index({ orderId: 1 });
returnSchema.index({ userId: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ customerName: 'text', returnNumber: 'text' });
returnSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Return', returnSchema);
