const InvoiceLoan = require('../models/InvoiceLoan');
const Order = require('../models/Order');

// @desc    Get all invoice loans
// @route   GET /api/invoice-loans
// @access  Private
exports.getInvoiceLoans = async (req, res) => {
  try {
    const { userId, status, search } = req.query;
    
    const query = {};
    if (userId) {
      query.userId = userId;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerCNIC: { $regex: search, $options: 'i' } }
      ];
    }

    const loans = await InvoiceLoan.find(query)
      .sort({ createdAt: -1 })
      .populate('orderId', 'shopName createdAt');

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    console.error('Error fetching invoice loans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice loans',
      error: error.message
    });
  }
};

// @desc    Get single invoice loan
// @route   GET /api/invoice-loans/:id
// @access  Private
exports.getInvoiceLoan = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }
    
    const loan = await InvoiceLoan.findOne(query)
      .populate('orderId')
      .populate('items.productId');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Invoice loan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    console.error('Error fetching invoice loan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice loan',
      error: error.message
    });
  }
};

// @desc    Create new invoice loan
// @route   POST /api/invoice-loans
// @access  Private
exports.createInvoiceLoan = async (req, res) => {
  try {
    const {
      userId,
      orderId,
      customerName,
      customerPhone,
      customerCNIC,
      customerAddress,
      items,
      totalAmount,
      dueDate,
      notes
    } = req.body;

    // Validation
    if (!userId || !orderId || !customerName || !customerPhone || !customerCNIC || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing'
      });
    }

    // Create invoice loan
    const loan = await InvoiceLoan.create({
      userId,
      orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerCNIC: customerCNIC.trim(),
      customerAddress: customerAddress ? customerAddress.trim() : '',
      items,
      totalAmount,
      remainingAmount: totalAmount,
      dueDate: dueDate || null,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Invoice loan created successfully',
      data: loan
    });
  } catch (error) {
    console.error('Error creating invoice loan:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating invoice loan',
      error: error.message
    });
  }
};

// @desc    Add payment to invoice loan
// @route   PUT /api/invoice-loans/:id/payment
// @access  Private
exports.addPayment = async (req, res) => {
  try {
    const { userId, amount, note } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment amount required'
      });
    }

    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }

    const loan = await InvoiceLoan.findOne(query);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Invoice loan not found'
      });
    }

    if (loan.status === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Loan is already fully paid'
      });
    }

    if (amount > loan.remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance. Remaining: ${loan.remainingAmount}`
      });
    }

    // Add payment
    loan.payments.push({
      amount,
      date: new Date(),
      note: note || ''
    });

    // Update amounts
    loan.amountPaid += amount;
    loan.remainingAmount -= amount;

    // Update status
    if (loan.remainingAmount === 0) {
      loan.status = 'Paid';
    } else if (loan.amountPaid > 0) {
      loan.status = 'Partial';
    }

    await loan.save();

    res.status(200).json({
      success: true,
      message: 'Payment added successfully',
      data: loan
    });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(400).json({
      success: false,
      message: 'Error adding payment',
      error: error.message
    });
  }
};

// @desc    Update invoice loan
// @route   PUT /api/invoice-loans/:id
// @access  Private
exports.updateInvoiceLoan = async (req, res) => {
  try {
    const { userId, dueDate, notes, status } = req.body;
    
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }

    const updateData = {};
    if (dueDate !== undefined) updateData.dueDate = dueDate;
    if (notes !== undefined) updateData.notes = notes;
    if (status && ['Pending', 'Partial', 'Paid'].includes(status)) {
      updateData.status = status;
    }

    const loan = await InvoiceLoan.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Invoice loan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice loan updated successfully',
      data: loan
    });
  } catch (error) {
    console.error('Error updating invoice loan:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating invoice loan',
      error: error.message
    });
  }
};

// @desc    Delete invoice loan
// @route   DELETE /api/invoice-loans/:id
// @access  Private
exports.deleteInvoiceLoan = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }

    const loan = await InvoiceLoan.findOneAndDelete(query);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Invoice loan not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice loan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice loan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting invoice loan',
      error: error.message
    });
  }
};

// @desc    Get invoice loan statistics
// @route   GET /api/invoice-loans/stats/overview
// @access  Private
exports.getInvoiceLoanStats = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const matchFilter = {};
    if (userId) {
      matchFilter.userId = new mongoose.Types.ObjectId(userId);
    }

    // Total stats
    const totalStats = await InvoiceLoan.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          totalRemaining: { $sum: '$remainingAmount' }
        }
      }
    ]);

    // Status breakdown
    const statusStats = await InvoiceLoan.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$remainingAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: totalStats[0] || {
          totalLoans: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0
        },
        byStatus: statusStats
      }
    });
  } catch (error) {
    console.error('Error fetching invoice loan stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice loan statistics',
      error: error.message
    });
  }
};
