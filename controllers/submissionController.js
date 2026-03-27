const submissionService = require('../services/submissionService');

// Create a new submission
exports.createSubmission = async (req, res) => {
    try {
        // IDOR Fix: Use student ID from JWT instead of req.body
        const student_id = req.user.sub;
        const { project_id } = req.body;

        if (!project_id) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        const submission = await submissionService.submitProject(student_id, project_id);
        res.status(201).json({ message: 'Project submitted successfully', submission });
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};

// Get all submissions for a project (for supervisor view)
exports.getSubmissionsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const submissions = await submissionService.getByProject(projectId);
        res.json({ success: true, requests: submissions });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Internal server error' });
    }
};

// Get all submissions (for supervisor dashboard)
exports.getAllSubmissions = async (req, res) => {
    try {
        // IDOR Fix: Use supervisor ID from JWT, ignore query params
        const supervisorId = req.user.sub;
        const submissions = await submissionService.getAll(supervisorId);
        res.json({ success: true, requests: submissions });
    } catch (error) {
        console.error('Error fetching all submissions:', error);
        res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Internal server error' });
    }
};

// Supervisor reviews a submission (Approve or Request Changes)
exports.reviewSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { status, supervisor_response, grade } = req.body;

        const submission = await submissionService.reviewSubmission(submissionId, {
            status,
            supervisor_response,
            grade
        });

        res.json({ message: 'Submission reviewed successfully', submission });
    } catch (error) {
        console.error('Error reviewing submission:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};

// Get a student's submission status
exports.getStudentSubmission = async (req, res) => {
    try {
        // IDOR Fix: Use student ID from JWT, ignore params
        const studentId = req.user.sub;
        const result = await submissionService.getStudentSubmission(studentId);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error fetching student submission:', error);
        res.status(error.statusCode || 500).json({ success: false, error: error.message || 'Internal server error' });
    }
};

// Get all supervisors for dropdown
exports.getAllSupervisors = async (req, res) => {
    try {
        const supervisors = await submissionService.getAllSupervisors();
        res.json(supervisors);
    } catch (error) {
        console.error('Error fetching supervisors:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};

// Student resubmits after changes requested — resets submission to Pending
exports.resubmitSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const submission = await submissionService.resubmit(submissionId);
        res.json({ message: 'Resubmitted successfully', submission });
    } catch (error) {
        console.error('Error resubmitting:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};
