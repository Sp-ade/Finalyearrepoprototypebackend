const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const { authenticate, isSupervisor } = require('../middleware/auth');

router.use(authenticate, isSupervisor);

// Get supervisor dashboard stats
router.get('/students', supervisorController.getAllStudents);

// Set a student as leader
router.put('/students/:userId/role', supervisorController.setStudentLeader);

// Unassign a student as leader
router.put('/students/:userId/unassign-role', supervisorController.unassignStudentLeader);

// Form a group
router.post('/groups', supervisorController.formGroup);

// Update a group
router.put('/groups/:groupNumber/:year', supervisorController.updateGroup);

module.exports = router;
