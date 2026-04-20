const Loan = require('../models/Loan');

// @desc    Get all loans
// @route   GET /api/loans
// @access  Public (should be private in real world, but following existing patterns)
exports.getLoans = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const query = {};
    if (userId) {
      query.userId = userId;
    }

    const loans = await Loan.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching loans',
      error: error.message
    });
  }
};

// @desc    Create new loan
// @route   POST /api/loans
// @access  Private
exports.createLoan = async (req, res) => {
  try {
    const loan = await Loan.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      data: loan
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating loan',
      error: error.message
    });
  }
};

// @desc    Update loan
// @route   PUT /api/loans/:id
// @access  Private
exports.updateLoan = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }

    const loan = await Loan.findOneAndUpdate(
      query,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found or you do not have permission'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Loan updated successfully',
      data: loan
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating loan',
      error: error.message
    });
  }
};

// @desc    Delete loan
// @route   DELETE /api/loans/:id
// @access  Private
exports.deleteLoan = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }

    const loan = await Loan.findOneAndDelete(query);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found or you do not have permission'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting loan',
      error: error.message
    });
  }
};
