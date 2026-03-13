const db = require('../Database');

class SubmissionRepository {
    /**
     * Check if a student already has a submission
     */
    async getExistingByStudent(studentId) {
        const result = await db.query(
            'SELECT * FROM Project_Submissions WHERE student_id = $1',
            [studentId]
        );
        return result.rows[0] || null;
    }

    /**
     * Create a new submission
     */
    async create(studentId, projectId) {
        const result = await db.query(
            `INSERT INTO Project_Submissions (student_id, project_id) 
             VALUES ($1, $2) 
             RETURNING *`,
            [studentId, projectId]
        );
        return result.rows[0];
    }

    /**
     * Get all submissions for a specific project (supervisor view)
     */
    async getByProject(projectId) {
        const result = await db.query(
            `SELECT s.*, u.first_name, u.last_name, u.email 
             FROM Project_Submissions s
             JOIN Users u ON s.student_id = u.id
             WHERE s.project_id = $1
             ORDER BY s.requested_at DESC`,
            [projectId]
        );
        return result.rows;
    }

    /**
     * Get all submissions (optionally filtered by supervisorId)
     */
    async getAll(supervisorId = null) {
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
        return result.rows;
    }

    /**
     * Get a single submission by ID
     */
    async getById(submissionId) {
        const result = await db.query(
            'SELECT * FROM Project_Submissions WHERE submission_id = $1',
            [submissionId]
        );
        return result.rows[0] || null;
    }

    /**
     * Update submission status (approve / request changes)
     * Returns the updated submission using a transaction client
     */
    async reviewWithTransaction(client, submissionId, status, supervisorResponse) {
        const result = await client.query(
            `UPDATE Project_Submissions 
             SET status = $1, supervisor_response = $2, reviewed_at = CURRENT_TIMESTAMP
             WHERE submission_id = $3
             RETURNING *`,
            [status, supervisorResponse, submissionId]
        );
        return result.rows[0] || null;
    }

    /**
     * Update the project on approval (within a transaction client)
     */
    async approveProject(client, projectId, grade, remark) {
        await client.query(
            `UPDATE Projects 
             SET status = 'Active', grade = $1, supervisor_remark = $2
             WHERE project_id = $3`,
            [grade || 'Pending', remark, projectId]
        );
    }

    /**
     * Get a student's own submission, or a member's leader submission
     */
    async getStudentSubmission(studentId, student_matric_no, role) {
        let query = `
            SELECT s.*, p.title as project_title 
            FROM Project_Submissions s
            JOIN Projects p ON s.project_id = p.project_id
            WHERE s.student_id = $1
        `;
        let params = [studentId];

        if (role === 'member') {
            query += ` OR p.student_ids LIKE $2`;
            params.push(`%"${student_matric_no}"%`);
        }

        const result = await db.query(query, params);
        return result.rows[0] || null;
    }

    /**
     * Get all supervisors for dropdown list
     */
    async getAllSupervisors() {
        const result = await db.query(
            "SELECT id, first_name, last_name, email FROM Users WHERE role = 'supervisor'"
        );
        return result.rows;
    }

    /**
     * Reset a submission back to Pending for resubmission
     */
    async resubmit(submissionId) {
        const result = await db.query(
            `UPDATE Project_Submissions
             SET status = 'Pending', supervisor_response = NULL, reviewed_at = NULL
             WHERE submission_id = $1
             RETURNING *`,
            [submissionId]
        );
        return result.rows[0] || null;
    }

    /**
     * Get student info (role + matric number)
     */
    async getStudentInfo(studentId) {
        const result = await db.query(
            'SELECT role, student_matric_no FROM Students WHERE user_id = $1',
            [studentId]
        );
        return result.rows[0] || null;
    }
}

module.exports = new SubmissionRepository();
