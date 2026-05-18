const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const storageController = require('../controllers/storageController');
const { verifyAdmin } = require('../middleware/adminAuth');
const { authenticate } = require('../middleware/auth');
const { handleBackupUpload, handleBackupUploadMemory } = require('../utils/backupUpload');

// Apply authentication and admin verification middleware to all routes
router.use(authenticate);
router.use(verifyAdmin);

// User Management Routes
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);
router.put('/users/:id/status', adminController.updateUserStatus);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Project Statistics Routes
router.get('/projects/stats', adminController.getProjectStats);

// Request Management Routes
router.get('/requests', adminController.getAllRequests);
router.get('/requests/stats', adminController.getRequestStats);

// Analytics Routes
router.get('/analytics/dashboard', adminController.getDashboardAnalytics);
router.get('/logs', adminController.getAllActivityLogs);
router.get('/logs/actions', adminController.getLogActionTypes);
router.get('/submissions/pending', adminController.getPendingSubmissions);
router.get('/requests/pending', adminController.getAllRequests); // Reusing existing getAllRequests controller

// Tag Management Routes
router.get('/tags', adminController.getAllTags);
router.put('/tags/:id', adminController.updateTag);
router.delete('/tags/:id', adminController.deleteTag);

// Supervisor Reassignment Route
router.put('/students/:studentId/reassign-supervisor', adminController.reassignLeaderSupervisor);
router.put('/students/:studentId/demote', adminController.demoteStudentLeader);
router.put('/projects/:projectId/reassign-supervisor', adminController.reassignProjectSupervisor);

// Group Management Routes (Admin)
router.get('/groups', adminController.getAllGroups);
router.put('/groups/:groupNumber/:year', adminController.updateGroup);
router.delete('/groups/:groupNumber/:year', adminController.disbandGroup);

// Database Management Routes
router.get('/database/backups', adminController.listBackups);
router.post('/database/backup', adminController.createBackup);
router.post('/database/restore', adminController.restoreBackup);
router.delete('/database/backup/:filename', adminController.deleteBackup);
router.get('/database/backup/:filename/download', adminController.downloadBackup);
router.post('/database/backup/upload', handleBackupUpload, adminController.uploadBackup);
router.post('/database/backup/upload-restore', handleBackupUploadMemory, adminController.uploadAndRestore);

// Storage Management Routes
router.post('/storage/cleanup', storageController.cleanupCloudinary);

module.exports = router;
