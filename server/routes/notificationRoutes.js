const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Middleware to extract userId from query/body
const setUserId = (req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }
  req.user = { id: userId };
  next();
};

// Apply middleware to all routes
router.use(setUserId);

// Generate new notifications (check all entities and create notifications)
router.post('/generate', notificationController.generateNotifications);

// Get all notifications with filtering
router.get('/', notificationController.getNotifications);

// Get notification counts by type
router.get('/counts', notificationController.getNotificationCounts);

// Get single notification by ID
router.get('/:id', notificationController.getNotificationById);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
