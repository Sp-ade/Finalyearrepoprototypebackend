const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Get supervisor dashboard stats
router.get('/students', supervisorController.getAllStudents);

// Set a student as leader
router.put('/students/:userId/role', supervisorController.setStudentLeader);

// Unassign a student as leader
router.put('/students/:userId/unassign-role', supervisorController.unassignStudentLeader);

module.exports = router;
