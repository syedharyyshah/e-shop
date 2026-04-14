const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST user login with approval check
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Simple password check (replace with bcrypt in production)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    if (!user.isApproved) {
      return res.status(403).json({ 
        message: 'Account pending approval. Please wait for admin approval.',
        status: 'pending'
      });
    }
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create user (Register)
router.post('/', async (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    idCardNumber: req.body.idCardNumber,
    birthday: req.body.birthday,
    gender: req.body.gender,
    phoneNumber: req.body.phoneNumber,
    address: req.body.address,
    shopName: req.body.shopName,
    isApproved: false // All new users need admin approval
  });

  try {
    const newUser = await user.save();
    res.status(201).json({
      message: 'Account created successfully. Please wait for admin approval.',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        shopName: newUser.shopName,
        isApproved: newUser.isApproved
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ message: `${field} already exists` });
    }
    res.status(400).json({ message: err.message });
  }
});

// GET pending users (not approved yet)
router.get('/pending', async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false, role: 'user' });
    res.json(pendingUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT approve user
router.put('/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User approved successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT reject user (delete)
router.put('/:id/reject', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User rejected and removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all approved users
router.get('/approved', async (req, res) => {
  try {
    const approvedUsers = await User.find({ isApproved: true, role: 'user' });
    res.json(approvedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user permanently (admin only)
router.delete('/:id/delete', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ 
      message: 'User deleted permanently',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET user settings
router.get('/:id/settings', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      settings: user.settings || { lowStockThreshold: 20, highStockThreshold: 200 }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update user settings
router.put('/:id/settings', async (req, res) => {
  try {
    const { lowStockThreshold, highStockThreshold } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        settings: {
          lowStockThreshold: lowStockThreshold || 20,
          highStockThreshold: highStockThreshold || 200
        }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Settings updated successfully',
      settings: user.settings
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;