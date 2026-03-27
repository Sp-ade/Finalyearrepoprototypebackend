const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Submit a project
router.post('/', submissionController.createSubmission);

// Get submissions for a specific project
router.get('/project/:projectId', submissionController.getSubmissionsByProject);

// Get a specific student's submission status
router.get('/student/:studentId', submissionController.getStudentSubmission);
router.get('/student', submissionController.getStudentSubmission);

// Get all supervisors
router.get('/supervisors', submissionController.getAllSupervisors);

// Get all submissions (Supervisor only)
router.get('/', submissionController.getAllSubmissions);

// Review a submission (Supervisor only)
router.patch('/:submissionId/review', submissionController.reviewSubmission);

// Resubmit a submission (Student only) - resets status to Pending
router.patch('/:submissionId/resubmit', submissionController.resubmitSubmission);

module.exports = router;
