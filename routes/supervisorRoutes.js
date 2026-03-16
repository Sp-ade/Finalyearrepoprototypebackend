const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');

// Get all students
router.get('/students', supervisorController.getAllStudents);

// Set a student as leader
router.put('/students/:userId/role', supervisorController.setStudentLeader);

// Unassign a student as leader
router.put('/students/:userId/unassign-role', supervisorController.unassignStudentLeader);

module.exports = router;
