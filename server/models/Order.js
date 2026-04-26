const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
  baseUnit: {
    type: String,
    default: 'piece'
  },
  parentUnit: {
    type: String,
    default: null
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  // Shop Details (stored at time of order creation)
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },
  // Customer Details (optional for regular customers, required for loan)
  customerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Customer name cannot exceed 100 characters'],
    default: 'Walk-in Customer'
  },
  customerAddress: {
    type: String,
    trim: true,
    maxlength: [500, 'Customer address cannot exceed 500 characters'],
    default: '-'
  },
  customerPhone: {
    type: String,
    trim: true,
    maxlength: [20, 'Customer phone cannot exceed 20 characters'],
    default: '-'
  },
  // Order Items
  items: [orderItemSchema],
  // Pricing
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
  taxRate: {
    type: Number,
    default: 10,
    min: [0, 'Tax rate cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'digital'],
    default: 'cash'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    default: null
  }
}, {
  timestamps: true
});

// Index for search performance
orderSchema.index({ customerName: 'text', customerPhone: 'text' });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
