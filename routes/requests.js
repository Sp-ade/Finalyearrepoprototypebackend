const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate } = require('../middleware/auth')

router.use(authenticate);

// Helper to wrap async routes
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Create a new request
router.post('/', asyncHandler(requestController.createRequest));

// Get all requests for a student
router.get('/student/:studentId', asyncHandler(requestController.getStudentRequests));
router.get('/student', asyncHandler(requestController.getStudentRequests));

// Get all requests for a supervisor
router.get('/supervisor/:supervisorId', asyncHandler(requestController.getSupervisorRequests));
router.get('/supervisor', asyncHandler(requestController.getSupervisorRequests));

// Update request status (e.g. approve/reject)
router.put('/:id', asyncHandler(requestController.updateRequest));

// Delete a request
router.delete('/:id', asyncHandler(requestController.deleteRequest));

module.exports = router;
