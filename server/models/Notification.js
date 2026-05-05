const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: [
      'OUT_OF_STOCK',
      'LOW_STOCK',
      'HIGH_STOCK',
      'LOAN_OVERDUE',
      'INVOICE_LOAN_OVERDUE',
      'PENDING_RETURN',
      'PARTIAL_PAYMENT',
      'PENDING_ORDER'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  // Reference to related entity
  relatedEntity: {
    type: {
      type: String,
      enum: ['Product', 'Loan', 'InvoiceLoan', 'Order', 'Return', null],
      default: null
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    name: {
      type: String,
      default: null
    }
  },
  // Additional data specific to notification type
  metadata: {
    stockQuantity: Number,
    threshold: Number,
    daysOverdue: Number,
    amountDue: Number,
    dueDate: Date,
    customerName: String
  },
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // For auto-generated notifications, track if still relevant
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
