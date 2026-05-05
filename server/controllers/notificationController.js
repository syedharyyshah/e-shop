const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const Product = require('../models/Product');
const Loan = require('../models/Loan');
const InvoiceLoan = require('../models/InvoiceLoan');
const Return = require('../models/Return');
const User = require('../models/User');
const Order = require('../models/Order');

// Helper function to calculate days overdue
const getDaysOverdue = (dueDate) => {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Generate notifications for a user
exports.generateNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const notifications = [];
    
    // Fetch all active notifications for this user to avoid duplicate queries
    const activeNotifications = await Notification.find({ userId, isActive: true });
    const notificationMap = new Map();
    activeNotifications.forEach(n => {
      const key = `${n.type}:${n.relatedEntity?.id}`;
      notificationMap.set(key, n);
    });

    // 1. Check for OUT_OF_STOCK
    const outOfStockProducts = await Product.find({ userId, stockQuantity: 0, isActive: true });
    for (const product of outOfStockProducts) {
      const key = `OUT_OF_STOCK:${product._id}`;
      if (!notificationMap.has(key)) {
        const notification = await Notification.create({
          userId,
          type: 'OUT_OF_STOCK',
          title: 'Product Out of Stock',
          message: `Your product "${product.productName}" is completely out of stock. Customers cannot purchase this item.`,
          relatedEntity: { type: 'Product', id: product._id, name: product.productName },
          metadata: { stockQuantity: 0 },
          priority: 'urgent'
        });
        notifications.push(notification);
      }
    }

    // 2. Check for LOW_STOCK
    const userSettings = user?.settings || { lowStockThreshold: 20 };
    const lowStockThreshold = userSettings.lowStockThreshold || 20;
    const lowStockProducts = await Product.find({
      userId,
      stockQuantity: { $gt: 0, $lte: lowStockThreshold },
      isActive: true
    });

    for (const product of lowStockProducts) {
      const key = `LOW_STOCK:${product._id}`;
      if (!notificationMap.has(key)) {
        const notification = await Notification.create({
          userId,
          type: 'LOW_STOCK',
          title: 'Low Stock Warning',
          message: `Product "${product.productName}" is running low on stock (${product.stockQuantity} remaining). Threshold is ${lowStockThreshold}.`,
          relatedEntity: { type: 'Product', id: product._id, name: product.productName },
          metadata: { stockQuantity: product.stockQuantity, threshold: lowStockThreshold },
          priority: 'high'
        });
        notifications.push(notification);
      }
    }

    // 3. Check for HIGH_STOCK
    const highStockThreshold = userSettings.highStockThreshold || 200;
    const highStockProducts = await Product.find({
      userId,
      stockQuantity: { $gte: highStockThreshold },
      isActive: true
    });

    for (const product of highStockProducts) {
      const key = `HIGH_STOCK:${product._id}`;
      if (!notificationMap.has(key)) {
        const notification = await Notification.create({
          userId,
          type: 'HIGH_STOCK',
          title: 'High Inventory Level',
          message: `Product "${product.productName}" has high stock levels (${product.stockQuantity}). Consider running a promotion.`,
          relatedEntity: { type: 'Product', id: product._id, name: product.productName },
          metadata: { stockQuantity: product.stockQuantity, threshold: highStockThreshold },
          priority: 'low'
        });
        notifications.push(notification);
      }
    }

    // 4. Check for LOAN_OVERDUE
    const overdueLoans = await Loan.find({
      userId,
      status: { $ne: 'Paid' },
      dueDate: { $lt: new Date() }
    });

    for (const loan of overdueLoans) {
      const daysOverdue = getDaysOverdue(loan.dueDate);
      const key = `LOAN_OVERDUE:${loan._id}`;
      const existing = notificationMap.get(key);

      if (!existing) {
        let message = `Loan for ${loan.borrowerName} is overdue by ${daysOverdue} days. Amount: PKR ${loan.amount.toLocaleString()}.`;
        let priority = 'high';

        if (daysOverdue >= 30) {
          message = `URGENT: ${loan.borrowerName} has not paid their loan for over a month (${daysOverdue} days). Please take action. Amount: PKR ${loan.amount.toLocaleString()}.`;
          priority = 'urgent';
        }

        const notification = await Notification.create({
          userId,
          type: 'LOAN_OVERDUE',
          title: daysOverdue >= 30 ? 'Critical Overdue Loan' : 'Overdue Loan',
          message,
          relatedEntity: { type: 'Loan', id: loan._id, name: loan.borrowerName },
          metadata: { daysOverdue, amountDue: loan.amount, dueDate: loan.dueDate },
          priority
        });
        notifications.push(notification);
      } else {
        // Update priority if it crosses 30 days
        if (daysOverdue >= 30 && existing.priority !== 'urgent') {
          existing.priority = 'urgent';
          existing.title = 'Critical Overdue Loan';
          existing.message = `URGENT: ${loan.borrowerName} has not paid their loan for over a month (${daysOverdue} days). Please take action. Amount: PKR ${loan.amount.toLocaleString()}.`;
          await existing.save();
        }
      }
    }

    // 5. Check for INVOICE_LOAN_OVERDUE
    const overdueInvoices = await InvoiceLoan.find({
      userId,
      status: { $ne: 'Paid' },
      dueDate: { $lt: new Date() }
    });

    for (const inv of overdueInvoices) {
      const daysOverdue = getDaysOverdue(inv.dueDate);
      const key = `INVOICE_LOAN_OVERDUE:${inv._id}`;
      
      if (!notificationMap.has(key)) {
        const notification = await Notification.create({
          userId,
          type: 'INVOICE_LOAN_OVERDUE',
          title: 'Invoice Payment Overdue',
          message: `Payment for Invoice #${inv.invoiceNumber} (${inv.customerName}) is overdue by ${daysOverdue} days. Amount: PKR ${inv.remainingAmount.toLocaleString()}.`,
          relatedEntity: { type: 'InvoiceLoan', id: inv._id, name: inv.customerName },
          metadata: { daysOverdue, amountDue: inv.remainingAmount, dueDate: inv.dueDate },
          priority: 'high'
        });
        notifications.push(notification);
      }
    }

    // 6. Check for PARTIAL_PAYMENT
    const partialInvoices = await InvoiceLoan.find({
      userId,
      status: 'Partial'
    });

    for (const inv of partialInvoices) {
      const key = `PARTIAL_PAYMENT:${inv._id}`;
      if (!notificationMap.has(key)) {
        const notification = await Notification.create({
          userId,
          type: 'PARTIAL_PAYMENT',
          title: 'Partial Payment Received',
          message: `Invoice #${inv.invoiceNumber} has a remaining balance of PKR ${inv.remainingAmount.toLocaleString()}.`,
          relatedEntity: { type: 'InvoiceLoan', id: inv._id, name: inv.customerName },
          metadata: { amountDue: inv.remainingAmount },
          priority: 'medium'
        });
        notifications.push(notification);
      }
    }

    // 7. Check for PENDING returns
    const pendingReturns = await Return.find({ userId, status: 'pending' });
    for (const returnItem of pendingReturns) {
      const key = `PENDING_RETURN:${returnItem._id}`;
      if (!notificationMap.has(key)) {
        const notification = await Notification.create({
          userId,
          type: 'PENDING_RETURN',
          title: 'Pending Return Request',
          message: `Return request #${returnItem.returnNumber} from ${returnItem.customerName} is pending approval.`,
          relatedEntity: { type: 'Return', id: returnItem._id, name: returnItem.returnNumber },
          metadata: { customerName: returnItem.customerName },
          priority: 'medium'
        });
        notifications.push(notification);
      }
    }

    // 8. Check for PENDING orders
    const pendingOrders = await Order.find({ userId, status: 'pending' });
    for (const order of pendingOrders) {
      const key = `PENDING_ORDER:${order._id}`;
      if (!notificationMap.has(key)) {
        const notification = await Notification.create({
          userId,
          type: 'PENDING_ORDER',
          title: 'New Pending Order',
          message: `Order for ${order.customerName} (PKR ${order.total.toLocaleString()}) is pending.`,
          relatedEntity: { type: 'Order', id: order._id, name: order.customerName },
          priority: 'medium'
        });
        notifications.push(notification);
      }
    }

    // Clean up old resolved notifications
    await cleanupResolvedNotifications(userId);

    res.status(200).json({
      success: true,
      message: `Generated ${notifications.length} new notifications`,
      data: {
        newNotifications: notifications,
        totalNew: notifications.length
      }
    });

  } catch (error) {
    console.error('Error generating notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating notifications',
      error: error.message
    });
  }
};

// Cleanup resolved notifications (mark as inactive when issue is resolved)
const cleanupResolvedNotifications = async (userId) => {
  // Mark OUT_OF_STOCK notifications as inactive if product now has stock
  const outOfStockNotifications = await Notification.find({
    userId,
    type: 'OUT_OF_STOCK',
    isActive: true
  });

  for (const notification of outOfStockNotifications) {
    const product = await Product.findById(notification.relatedEntity.id);
    if (product && product.stockQuantity > 0) {
      notification.isActive = false;
      await notification.save();
    }
  }

  // Mark LOW_STOCK notifications as inactive if stock is normal
  const lowStockNotifications = await Notification.find({
    userId,
    type: 'LOW_STOCK',
    isActive: true
  });

  const user = await User.findById(userId);
  const lowStockThreshold = user?.settings?.lowStockThreshold || 20;

  for (const notification of lowStockNotifications) {
    const product = await Product.findById(notification.relatedEntity.id);
    if (product && (product.stockQuantity > lowStockThreshold || product.stockQuantity === 0)) {
      notification.isActive = false;
      await notification.save();
    }
  }

  // Mark LOAN_OVERDUE notifications as inactive if loan is paid
  const overdueLoanNotifications = await Notification.find({
    userId,
    type: 'LOAN_OVERDUE',
    isActive: true
  });

  for (const notification of overdueLoanNotifications) {
    const loan = await Loan.findById(notification.relatedEntity.id);
    if (loan && loan.status === 'Paid') {
      notification.isActive = false;
      await notification.save();
    }
  }

  // Mark INVOICE_LOAN_OVERDUE notifications as inactive if loan is paid
  const overdueInvoiceNotifications = await Notification.find({
    userId,
    type: 'INVOICE_LOAN_OVERDUE',
    isActive: true
  });

  for (const notification of overdueInvoiceNotifications) {
    const loan = await InvoiceLoan.findById(notification.relatedEntity.id);
    if (loan && loan.status === 'Paid') {
      notification.isActive = false;
      await notification.save();
    }
  }

  // Mark PARTIAL_PAYMENT notifications as inactive if loan is paid
  const partialNotifications = await Notification.find({
    userId,
    type: 'PARTIAL_PAYMENT',
    isActive: true
  });

  for (const notification of partialNotifications) {
    const loan = await InvoiceLoan.findById(notification.relatedEntity.id);
    if (loan && loan.status === 'Paid') {
      notification.isActive = false;
      await notification.save();
    }
  }

  // Mark PENDING_RETURN notifications as inactive if return is processed
  const pendingReturnNotifications = await Notification.find({
    userId,
    type: 'PENDING_RETURN',
    isActive: true
  });

  for (const notification of pendingReturnNotifications) {
    const returnItem = await Return.findById(notification.relatedEntity.id);
    if (returnItem && returnItem.status !== 'pending') {
      notification.isActive = false;
      await notification.save();
    }
  }

  // Mark PENDING_ORDER notifications as inactive if order is processed
  const pendingOrderNotifications = await Notification.find({
    userId,
    type: 'PENDING_ORDER',
    isActive: true
  });

  for (const notification of pendingOrderNotifications) {
    const order = await Order.findById(notification.relatedEntity.id);
    if (order && order.status !== 'pending') {
      notification.isActive = false;
      await notification.save();
    }
  }
};

// Get all notifications for user
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, isRead, priority, limit = 50, page = 1 } = req.query;

    const query = { userId };
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (priority) query.priority = priority;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    const activeCount = await Notification.countDocuments({ userId, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        total,
        unreadCount,
        activeCount,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Get notification counts by type
exports.getNotificationCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const counts = await Notification.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      }
    ]);

    const totalUnread = await Notification.countDocuments({ userId, isRead: false, isActive: true });
    const totalActive = await Notification.countDocuments({ userId, isActive: true });

    // Format counts object
    const countsByType = {};
    counts.forEach(item => {
      countsByType[item._id] = {
        total: item.count,
        unread: item.unread
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalUnread,
        totalActive,
        byType: countsByType
      }
    });

  } catch (error) {
    console.error('Error getting notification counts:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting notification counts',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body;

    const query = { userId, isRead: false };
    if (type) query.type = type;

    const result = await Notification.updateMany(
      query,
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: { modifiedCount: result.modifiedCount }
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Get single notification
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification',
      error: error.message
    });
  }
};
