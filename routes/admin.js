const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/adminAuth');

// Apply admin verification middleware to all routes
router.use(verifyAdmin);

// User Management Routes
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);
router.put('/users/:id/status', adminController.updateUserStatus);

// Project Statistics Routes
router.get('/projects/stats', adminController.getProjectStats);

// Request Management Routes
router.get('/requests', adminController.getAllRequests);
router.get('/requests/stats', adminController.getRequestStats);

// Analytics Routes
router.get('/analytics/dashboard', adminController.getDashboardAnalytics);

// Tag Management Routes
router.get('/tags', adminController.getAllTags);
router.put('/tags/:id', adminController.updateTag);
router.delete('/tags/:id', adminController.deleteTag);

module.exports = router;
