const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Generate unique return number
const generateReturnNumber = async () => {
  const prefix = 'RET';
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${random}`;
};

// @desc    Get all returns
// @route   GET /api/returns
// @access  Private
exports.getReturns = async (req, res) => {
  try {
    const {
      search,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
      userId
    } = req.query;

    // Build filter object
    const filter = {};

    // Filter by userId
    if (userId) {
      filter.userId = userId;
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Search filter (customer name or return number)
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { returnNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const returns = await Return.find(filter)
      .populate('orderId', 'customerName total')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const total = await Return.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: returns.length,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      data: returns
    });
  } catch (error) {
    console.error('Error fetching returns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching returns',
      error: error.message
    });
  }
};

// @desc    Get single return
// @route   GET /api/returns/:id
// @access  Private
exports.getReturn = async (req, res) => {
  try {
    const { userId } = req.query;

    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }

    const returnRecord = await Return.findOne(query)
      .populate('orderId')
      .populate('items.productId');

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found'
      });
    }

    res.status(200).json({
      success: true,
      data: returnRecord
    });
  } catch (error) {
    console.error('Error fetching return:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching return',
      error: error.message
    });
  }
};

// @desc    Create a return (partial or full)
// @route   POST /api/returns
// @access  Private
exports.createReturn = async (req, res) => {
  try {
    const {
      userId,
      orderId,
      items,
      returnType,
      refundMethod,
      notes,
      processedBy
    } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required for return'
      });
    }

    // Find the original order
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be returned
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot return a cancelled order'
      });
    }

    // Validate items and update stock
    const returnItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Find the original order item
      const orderItem = order.items.find(
        oi => oi.productId.toString() === item.productId
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found in original order`
        });
      }

      // Check if return quantity is valid
      if (item.quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot return more than purchased quantity for ${orderItem.productName}. Purchased: ${orderItem.quantity}, Trying to return: ${item.quantity}`
        });
      }

      // Find the product to update stock
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      // Calculate quantity in base units for stock update
      let baseQuantity = item.quantity;
      if (item.unitType === 'bulk' && product.unitsPerParent) {
        baseQuantity = item.quantity * product.unitsPerParent;
      }

      // Update product stock (add back the returned items)
      product.stockQuantity += baseQuantity;
      await product.save();

      // Create return item
      const returnItem = {
        productId: item.productId,
        productName: orderItem.productName,
        quantity: item.quantity,
        unitType: item.unitType || orderItem.unitType,
        unitPrice: orderItem.unitPrice,
        total: item.quantity * orderItem.unitPrice,
        returnReason: item.returnReason || null
      };

      returnItems.push(returnItem);
      subtotal += returnItem.total;
    }

    // Calculate tax and total
    const taxRate = order.taxRate || 10;
    const tax = Math.round((subtotal * taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Generate return number
    const returnNumber = await generateReturnNumber();

    // Create return record
    const returnRecord = await Return.create({
      userId,
      orderId,
      returnNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: returnItems,
      subtotal,
      tax,
      total,
      returnType: returnType || 'partial',
      refundMethod: refundMethod || 'cash',
      notes: notes || null,
      processedBy: processedBy || null,
      status: 'completed',
      refundStatus: 'completed',
      refundDate: new Date()
    });

    // Update order with return reference
    order.returns.push(returnRecord._id);

    // Automatically determine if this is a full or partial return
    // by comparing returned items with original order items
    let isFullReturn = true;
    
    // Check if all order items are fully returned
    for (const orderItem of order.items) {
      // Sum up the returned quantity for this product across all returns
      let totalReturnedQty = 0;
      
      // Include the current return
      const currentReturnItem = returnItems.find(ri => ri.productId.toString() === orderItem.productId.toString());
      if (currentReturnItem) {
        totalReturnedQty += currentReturnItem.quantity;
      }
      
      // Also check previous returns
      for (const existingReturnId of order.returns) {
        if (existingReturnId.toString() !== returnRecord._id.toString()) {
          const existingReturn = await Return.findById(existingReturnId);
          if (existingReturn) {
            const existingItem = existingReturn.items.find(ri => ri.productId.toString() === orderItem.productId.toString());
            if (existingItem) {
              totalReturnedQty += existingItem.quantity;
            }
          }
        }
      }
      
      // If any item's returned quantity is less than purchased quantity, it's a partial return
      if (totalReturnedQty < orderItem.quantity) {
        isFullReturn = false;
        break;
      }
    }
    
    // Also check if the return amount equals the order total (with small tolerance for rounding)
    const returnedTotal = returnItems.reduce((sum, item) => sum + item.total, 0);
    const isFullAmount = Math.abs(returnedTotal - order.total) < 0.01;

    console.log('Return detection:', { 
      returnTypeFromClient: returnType, 
      isFullReturn, 
      isFullAmount, 
      returnedTotal, 
      orderTotal: order.total 
    });

    // Update order return status based on actual returned items
    if (isFullReturn || isFullAmount || returnType === 'full') {
      order.returnStatus = 'full';
      order.status = 'returned';
    } else {
      order.returnStatus = 'partial';
      order.status = 'partially_returned';
    }

    await order.save();

    res.status(201).json({
      success: true,
      message: 'Return processed successfully',
      data: returnRecord
    });
  } catch (error) {
    console.error('Error creating return:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating return',
      error: error.message
    });
  }
};

// @desc    Update return status
// @route   PUT /api/returns/:id
// @access  Private
exports.updateReturn = async (req, res) => {
  try {
    const { userId, status, refundStatus, notes } = req.body;

    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (refundStatus) {
      updateData.refundStatus = refundStatus;
      if (refundStatus === 'completed') {
        updateData.refundDate = new Date();
      }
    }
    if (notes !== undefined) updateData.notes = notes;

    const returnRecord = await Return.findOneAndUpdate(
      query,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found or you do not have permission to update it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Return updated successfully',
      data: returnRecord
    });
  } catch (error) {
    console.error('Error updating return:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating return',
      error: error.message
    });
  }
};

// @desc    Delete return
// @route   DELETE /api/returns/:id
// @access  Private
exports.deleteReturn = async (req, res) => {
  try {
    const { userId } = req.query;

    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }

    const returnRecord = await Return.findOne(query);

    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: 'Return not found or you do not have permission to delete it'
      });
    }

    // Restore stock for returned items
    for (const item of returnRecord.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        let baseQuantity = item.quantity;
        if (item.unitType === 'bulk' && product.unitsPerParent) {
          baseQuantity = item.quantity * product.unitsPerParent;
        }
        // Subtract back the returned quantity (since we're deleting the return)
        product.stockQuantity -= baseQuantity;
        await product.save();
      }
    }

    // Remove return reference from order
    const order = await Order.findById(returnRecord.orderId);
    if (order) {
      order.returns = order.returns.filter(
        retId => retId.toString() !== returnRecord._id.toString()
      );

      // Recalculate return status
      if (order.returns.length === 0) {
        order.returnStatus = 'none';
        order.status = 'completed';
      } else {
        const remainingReturns = await Return.find({
          _id: { $in: order.returns }
        });
        const hasFullReturn = remainingReturns.some(r => r.returnType === 'full');
        if (hasFullReturn) {
          order.returnStatus = 'full';
          order.status = 'returned';
        } else {
          order.returnStatus = 'partial';
          order.status = 'partially_returned';
        }
      }
      await order.save();
    }

    await Return.findOneAndDelete(query);

    res.status(200).json({
      success: true,
      message: 'Return deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting return:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting return',
      error: error.message
    });
  }
};

// @desc    Get returns for a specific order
// @route   GET /api/returns/order/:orderId
// @access  Private
exports.getOrderReturns = async (req, res) => {
  try {
    const { userId } = req.query;
    const { orderId } = req.params;

    const filter = { orderId };
    if (userId) {
      filter.userId = userId;
    }

    const returns = await Return.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: returns.length,
      data: returns
    });
  } catch (error) {
    console.error('Error fetching order returns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order returns',
      error: error.message
    });
  }
};

// @desc    Get return statistics
// @route   GET /api/returns/stats/overview
// @access  Private
exports.getReturnStats = async (req, res) => {
  try {
    const { userId } = req.query;

    const matchFilter = {};
    if (userId) {
      matchFilter.userId = new mongoose.Types.ObjectId(userId);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total stats
    const totalStats = await Return.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalReturns: { $sum: 1 },
          totalRefundAmount: { $sum: '$total' },
          averageReturnValue: { $avg: '$total' }
        }
      }
    ]);

    // Today's stats
    const todayStats = await Return.aggregate([
      {
        $match: {
          ...matchFilter,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          returns: { $sum: 1 },
          refundAmount: { $sum: '$total' }
        }
      }
    ]);

    // This month's stats
    const monthStats = await Return.aggregate([
      {
        $match: {
          ...matchFilter,
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          returns: { $sum: 1 },
          refundAmount: { $sum: '$total' }
        }
      }
    ]);

    // Status breakdown
    const statusStats = await Return.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Return type breakdown
    const typeStats = await Return.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$returnType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: totalStats[0] || {
          totalReturns: 0,
          totalRefundAmount: 0,
          averageReturnValue: 0
        },
        today: todayStats[0] || {
          returns: 0,
          refundAmount: 0
        },
        thisMonth: monthStats[0] || {
          returns: 0,
          refundAmount: 0
        },
        byStatus: statusStats,
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Error fetching return stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching return statistics',
      error: error.message
    });
  }
};
