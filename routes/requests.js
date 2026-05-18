const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate, isStudent, isSupervisor } = require('../middleware/auth')

router.use(authenticate);

// Helper to wrap async routes
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Create a new request (students only)
router.post('/', isStudent, asyncHandler(requestController.createRequest));

// Get all requests for a student (students only)
router.get('/student/:studentId', isStudent, asyncHandler(requestController.getStudentRequests));
router.get('/student', isStudent, asyncHandler(requestController.getStudentRequests));

// Get all requests for a supervisor (supervisors only)
router.get('/supervisor/:supervisorId', isSupervisor, asyncHandler(requestController.getSupervisorRequests));
router.get('/supervisor', isSupervisor, asyncHandler(requestController.getSupervisorRequests));

// Update request status — approve/reject (supervisors only)
router.put('/:id', isSupervisor, asyncHandler(requestController.updateRequest));

// Delete a request (students only — withdrawing their own request)
router.delete('/:id', isStudent, asyncHandler(requestController.deleteRequest));

module.exports = router;
