const express = require('express');
const router = express.Router();
const seedProducts = require('../utils/seedProducts');

// @desc    Seed products database
// @route   POST /api/seed/products
// @access  Public (for development only)
router.post('/products', async (req, res) => {
  try {
    const products = await seedProducts();
    res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: error.message
    });
  }
});

module.exports = router;
