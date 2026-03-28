const express = require('express');
const router = express.Router();
const staffPermissionController = require('../controllers/staffPermissionController');
const { authenticate } = require('../middleware/auth');
const { verifyAdmin } = require('../middleware/adminAuth');

// ── Supervisor routes ─────────────────────────────────────────────────────────
// Submit (or re-submit) an edit-permission request for a project
router.post('/', authenticate, staffPermissionController.requestPermission);

// List the logged-in supervisor's own requests
router.get('/mine', authenticate, staffPermissionController.getMyPermissions);

// Check permission status for a specific project
router.get('/project/:projectId', authenticate, staffPermissionController.getPermissionForProject);

// ── Admin routes ──────────────────────────────────────────────────────────────
// List all staff permission requests (optionally: ?status=Pending)
router.get('/admin', authenticate, verifyAdmin, staffPermissionController.getAllPermissions);

// Approve or reject a request
router.put('/admin/:id', authenticate, verifyAdmin, staffPermissionController.reviewPermission);

module.exports = router;
