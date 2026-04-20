const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
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

    // Search filter (customer name or phone)
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const orders = await Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }
    
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { userId, customerName, customerAddress, customerPhone, items, paymentMethod, notes } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!customerName || !customerAddress || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, address, and phone are required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Fetch user to get shopName
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate each item and update stock
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      // Calculate quantity in base units
      let baseQuantity = item.quantity;
      if (item.unitType === 'bulk' && product.unitsPerParent) {
        baseQuantity = item.quantity * product.unitsPerParent;
      }

      // Check stock availability
      if (product.stockQuantity < baseQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.productName}. Available: ${product.stockQuantity}, Required: ${baseQuantity}`
        });
      }

      // Update product stock
      product.stockQuantity -= baseQuantity;
      await product.save();

      // Create order item
      const orderItem = {
        productId: item.productId,
        productName: product.productName,
        quantity: item.quantity,
        unitType: item.unitType || 'single',
        unitPrice: item.price,
        total: item.total,
        baseUnit: product.baseUnit || 'piece',
        parentUnit: product.parentUnit || null
      };

      orderItems.push(orderItem);
      subtotal += item.total;
    }

    // Calculate tax and total
    const taxRate = 10; // 10% tax
    const tax = Math.round((subtotal * taxRate / 100) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Create order
    const order = await Order.create({
      userId,
      shopName: user.shopName,
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      customerPhone: customerPhone.trim(),
      items: orderItems,
      subtotal,
      tax,
      taxRate,
      total,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || null,
      status: 'completed'
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res) => {
  try {
    const { userId, status, notes } = req.body;
    
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }
    
    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const order = await Order.findOneAndUpdate(
      query,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission to update it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating order',
      error: error.message
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
exports.deleteOrder = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }
    
    const order = await Order.findOneAndDelete(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats/overview
// @access  Private
exports.getOrderStats = async (req, res) => {
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
    const totalStats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalTax: { $sum: '$tax' },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    // Today's stats
    const todayStats = await Order.aggregate([
      { 
        $match: { 
          ...matchFilter,
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);

    // This month's stats
    const monthStats = await Order.aggregate([
      { 
        $match: { 
          ...matchFilter,
          createdAt: { $gte: thisMonth }
        }
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      }
    ]);

    // Status breakdown
    const statusStats = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: totalStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalTax: 0,
          averageOrderValue: 0
        },
        today: todayStats[0] || {
          orders: 0,
          revenue: 0
        },
        thisMonth: monthStats[0] || {
          orders: 0,
          revenue: 0
        },
        byStatus: statusStats
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
};
