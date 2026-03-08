const db = require('../Database');

// Create a new submission
exports.createSubmission = async (req, res) => {
    try {
        const { student_id, project_id } = req.body;

        if (!student_id || !project_id) {
            return res.status(400).json({ error: 'Student ID and Project ID are required' });
        }

        // Check if student already has a submission (enforced by DB, but good to check)
        const existing = await db.query(
            'SELECT * FROM Project_Submissions WHERE student_id = $1',
            [student_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Student has already submitted a project.' });
        }

        const result = await db.query(
            `INSERT INTO Project_Submissions (student_id, project_id) 
             VALUES ($1, $2) 
             RETURNING *`,
            [student_id, project_id]
        );

        res.status(201).json({ message: 'Project submitted successfully', submission: result.rows[0] });
    } catch (error) {
        console.error('Error creating submission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all submissions for a project (for supervisor view)
exports.getSubmissionsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const result = await db.query(
            `SELECT s.*, u.first_name, u.last_name, u.email 
             FROM Project_Submissions s
             JOIN Users u ON s.student_id = u.id
             WHERE s.project_id = $1
             ORDER BY s.requested_at DESC`,
            [projectId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all submissions (for supervisor dashboard)
exports.getAllSubmissions = async (req, res) => {
    try {
        const { supervisorId } = req.query;
        let query = `
            SELECT s.*, 
                   p.title as project_title, 
                   u.first_name as student_first_name, 
                   u.last_name as student_last_name, 
                   u.email as student_email
            FROM Project_Submissions s
            JOIN Projects p ON s.project_id = p.project_id
            JOIN Users u ON s.student_id = u.id
        `;

        const params = [];
        if (supervisorId) {
            query += ` WHERE p.supervisor_id = $1`;
            params.push(supervisorId);
        }

        query += ` ORDER BY s.requested_at DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Supervisor reviews a submission (Approve or Request Changes)
exports.reviewSubmission = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        const { submissionId } = req.params;
        const { status, supervisor_response, grade } = req.body;

        if (!['Approved', 'Changes Requested'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be "Approved" or "Changes Requested".' });
        }

        // 1. Update Submission Status
        const submissionResult = await client.query(
            `UPDATE Project_Submissions 
             SET status = $1, supervisor_response = $2, reviewed_at = CURRENT_TIMESTAMP
             WHERE submission_id = $3
             RETURNING *`,
            [status, supervisor_response, submissionId]
        );

        if (submissionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Submission not found' });
        }

        const submission = submissionResult.rows[0];

        // 2. If Approved, Update Project Status to Active (Uploaded)
        if (status === 'Approved') {
            await client.query(
                `UPDATE Projects 
                 SET status = 'Active', grade = $1, supervisor_remark = $2
                 WHERE project_id = $3`,
                [grade || 'Pending', supervisor_response, submission.project_id]
            );
        } else if (status === 'Changes Requested') {
            // Optional: Set project status back to pending if needed, but it should already be pending.
        }

        await client.query('COMMIT');
        res.json({ message: 'Submission reviewed successfully', submission });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error reviewing submission:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// Get a student's submission status
exports.getStudentSubmission = async (req, res) => {
    try {
        const { studentId } = req.params;

        // 1. Fetch student role & matric number
        const studentInfoParams = await db.query(
            'SELECT role, student_matric_no FROM Students WHERE user_id = $1',
            [studentId]
        );

        if (studentInfoParams.rows.length === 0) {
            return res.status(404).json({ error: 'Student profile not found' });
        }

        const { role, student_matric_no } = studentInfoParams.rows[0];

        // 2. Build query to check for submissions
        let query = `
             SELECT s.*, p.title as project_title 
             FROM Project_Submissions s
             JOIN Projects p ON s.project_id = p.project_id
             WHERE s.student_id = $1
        `;
        let params = [studentId];

        // If member, they can also see a submission where their matric is listed
        if (role === 'member') {
            query += ` OR p.student_ids LIKE $2`;
            params.push(`%"${student_matric_no}"%`);
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.json({ submitted: false, role });
        }

        res.json({ submitted: true, role, submission: result.rows[0] });
    } catch (error) {
        console.error('Error fetching student submission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all supervisors for dropdown
exports.getAllSupervisors = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, first_name, last_name, email FROM Users WHERE role = 'supervisor'"
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching supervisors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Student resubmits after changes requested — resets submission to Pending
exports.resubmitSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;

        const result = await db.query(
            `UPDATE Project_Submissions
             SET status = 'Pending', supervisor_response = NULL, reviewed_at = NULL
             WHERE submission_id = $1
             RETURNING *`,
            [submissionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        res.json({ message: 'Resubmitted successfully', submission: result.rows[0] });
    } catch (error) {
        console.error('Error resubmitting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
