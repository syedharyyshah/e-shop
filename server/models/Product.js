const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'PKR',
    enum: ['PKR']
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  piecesPerUnit: {
    type: Number,
    min: [1, 'Pieces per unit must be at least 1'],
    default: 1
  },
  baseUnit: {
    type: String,
    trim: true,
    maxlength: [20, 'Base unit cannot exceed 20 characters'],
    default: 'piece'
  },
  // Multi-unit product fields (optional)
  parentUnit: {
    type: String,
    trim: true,
    maxlength: [20, 'Parent unit cannot exceed 20 characters'],
    default: null
  },
  unitsPerParent: {
    type: Number,
    min: [1, 'Units per parent must be at least 1'],
    default: null
  },
  purchasePrice: {
    type: Number,
    min: [0, 'Purchase price cannot be negative'],
    default: null
  },
  costPerUnit: {
    type: Number,
    min: [0, 'Cost per unit cannot be negative'],
    default: null
  },
  profitPerUnit: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: null
  },
  imageUrl: {
    type: String,
    trim: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for search performance
productSchema.index({ productName: 'text', companyName: 'text', category: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ companyName: 1 });
productSchema.index({ stockQuantity: 1 });

module.exports = mongoose.model('Product', productSchema);
