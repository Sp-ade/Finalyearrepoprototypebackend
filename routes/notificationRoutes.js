const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Main SSE Stream endpoint (MUST BE A GET REQUEST)
router.get('/stream', notificationController.streamNotifications);

// Offline DB endpoints
router.get('/unread', notificationController.getUnreadNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
