const Product = require('../models/Product');
const mongoose = require('mongoose');

// Helper: Calculate cost per unit from purchase data
const calculateCostPerUnit = (purchasePrice, unitsPerParent) => {
  if (purchasePrice && unitsPerParent && unitsPerParent > 0) {
    return Math.round((purchasePrice / unitsPerParent) * 100) / 100;
  }
  return null;
};

// Helper: Calculate profit per unit
const calculateProfitPerUnit = (price, costPerUnit) => {
  if (price !== undefined && costPerUnit !== null && costPerUnit !== undefined) {
    return Math.round((price - costPerUnit) * 100) / 100;
  }
  return null;
};

// Helper: Convert quantity to base units
const convertToBaseUnits = (quantity, unitType, unitsPerParent) => {
  if (unitType === 'parent' && unitsPerParent) {
    return quantity * unitsPerParent;
  }
  return quantity;
};

// Helper: Calculate stock in parent units
const getStockInParentUnits = (stockQuantity, unitsPerParent) => {
  if (!unitsPerParent || unitsPerParent < 1) return null;
  return {
    full: Math.floor(stockQuantity / unitsPerParent),
    remainder: stockQuantity % unitsPerParent
  };
};

// Helper: Validate multi-unit product fields
const validateMultiUnitFields = (body) => {
  const errors = [];
  
  // If parentUnit is provided, validate related fields
  if (body.parentUnit) {
    if (!body.unitsPerParent || body.unitsPerParent < 1) {
      errors.push('unitsPerParent is required and must be at least 1 when parentUnit is provided');
    }
    if (body.purchasePrice === undefined || body.purchasePrice === null || body.purchasePrice < 0) {
      errors.push('purchasePrice is required and cannot be negative when parentUnit is provided');
    }
  }
  
  // Validate piecesPerUnit
  if (body.piecesPerUnit !== undefined && body.piecesPerUnit !== null && body.piecesPerUnit < 1) {
    errors.push('piecesPerUnit must be at least 1');
  }
  
  // Prevent zero division for unitsPerParent
  if (body.unitsPerParent !== undefined && body.unitsPerParent !== null && body.unitsPerParent === 0) {
    errors.push('unitsPerParent cannot be zero');
  }
  
  return errors;
};

// Helper: Process product data before save/update
const processProductData = (body) => {
  const data = { ...body };
  
  // Set defaults
  if (!data.piecesPerUnit) {
    data.piecesPerUnit = 1;
  }
  if (!data.baseUnit) {
    data.baseUnit = 'piece';
  }
  
  // Calculate cost per unit if parent unit data is provided
  if (data.parentUnit && data.purchasePrice && data.unitsPerParent) {
    data.costPerUnit = calculateCostPerUnit(data.purchasePrice, data.unitsPerParent);
  } else if (data.costPerUnit === undefined) {
    // If no parent unit, cost per unit equals selling price (or can be set manually)
    data.costPerUnit = data.costPerUnit || data.price || null;
  }
  
  // Calculate profit per unit
  if (data.price !== undefined && data.costPerUnit !== undefined) {
    data.profitPerUnit = calculateProfitPerUnit(data.price, data.costPerUnit);
  }
  
  return data;
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      company,
      minPrice,
      maxPrice,
      stockStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 100,
      userId
    } = req.query;

    // Build filter object
    const filter = {};

    // Filter by userId if provided (for user-specific products)
    if (userId) {
      filter.userId = userId;
    }

    // Search filter (product name, company name, or category)
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Company filter
    if (company && company !== 'all') {
      filter.companyName = { $regex: new RegExp(`^${company}$`, 'i') };
    }

    // Price range filter
    if (minPrice !== undefined && minPrice !== '') {
      filter.price = { ...filter.price, $gte: Number(minPrice) };
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      filter.price = { ...filter.price, $lte: Number(maxPrice) };
    }

    // Stock status filter
    if (stockStatus && stockStatus !== 'all') {
      switch (stockStatus) {
        case 'out-of-stock':
          filter.stockQuantity = 0;
          break;
        case 'low-stock':
          filter.stockQuantity = { $gt: 0, $lte: 20 };
          break;
        case 'in-stock':
          filter.stockQuantity = { $gt: 20 };
          break;
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Get unique categories and companies for filters
    const categories = await Product.distinct('category');
    const companies = await Product.distinct('companyName');

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      filters: {
        categories: categories.sort(),
        companies: companies.sort()
      },
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Build query
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }
    
    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res) => {
  try {
    // Validate multi-unit product fields
    const validationErrors = validateMultiUnitFields(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Process product data (calculate cost, set defaults)
    const processedData = processProductData(req.body);
    
    // userId is required now, it should be passed in req.body
    const product = await Product.create(processedData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate multi-unit product fields
    const validationErrors = validateMultiUnitFields(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    // Process product data (calculate cost, set defaults)
    const processedData = processProductData(req.body);
    
    // Build query - ensure user can only update their own products
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }
    
    const product = await Product.findOneAndUpdate(
      query,
      processedData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to update it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Build query - ensure user can only delete their own products
    const query = { _id: req.params.id };
    if (userId) {
      query.userId = userId;
    }
    
    const product = await Product.findOneAndDelete(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to delete it'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Public
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = req.query.threshold || 20;
    const { userId } = req.query;

    // Build filter
    const filter = {
      stockQuantity: { $gt: 0, $lte: Number(threshold) }
    };
    
    // Filter by userId if provided
    if (userId) {
      filter.userId = userId;
    }

    const products = await Product.find(filter).sort({ stockQuantity: 1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message
    });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/products/stats/inventory
// @access  Public
exports.getInventoryStats = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // Build match filter
    const matchFilter = {};
    if (userId) {
      matchFilter.userId = new mongoose.Types.ObjectId(userId);
    }

    const stats = await Product.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
          outOfStock: {
            $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] }
          },
          lowStock: {
            $sum: { $cond: [{ $and: [{ $gt: ['$stockQuantity', 0] }, { $lte: ['$stockQuantity', 20] }] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {
          totalProducts: 0,
          totalValue: 0,
          outOfStock: 0,
          lowStock: 0
        },
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory stats',
      error: error.message
    });
  }
};
