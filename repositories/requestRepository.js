const db = require('../Database');

class RequestRepository {
    /**
     * Create a new access request
     */
    async createRequest(studentId, projectId, reason) {
        const query = `
            INSERT INTO Access_Requests_Student 
            (student_id, project_id, request_reason)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        try {
            const result = await db.query(query, [studentId, projectId, reason]);
            return result.rows[0];
        } catch (error) {
            // Check for unique constraint violation (student already requested this project)
            if (error.code === '23505') {
                throw new Error('You have already requested to join this project.');
            }
            throw error;
        }
    }

    /**
     * Get all requests for a specific student, including project details
     */
    async getRequestsByStudent(studentId) {
        const query = `
            SELECT 
                r.*,
                p.title as project_title,
                u.first_name || ' ' || u.last_name as supervisor_name
            FROM Access_Requests_Student r
            JOIN Projects p ON r.project_id = p.project_id
            LEFT JOIN Users u ON p.supervisor_id = u.id
            WHERE r.student_id = $1
            ORDER BY r.requested_at DESC
        `;

        const result = await db.query(query, [studentId]);
        return result.rows;
    }

    /**
     * Get all requests for a specific supervisor (via their projects)
     */
    async getRequestsBySupervisor(supervisorId) {
        const query = `
            SELECT 
                r.*,
                p.title as project_title,
                s.first_name || ' ' || s.last_name as student_name,
                s.email as student_email
            FROM Access_Requests_Student r
            JOIN Projects p ON r.project_id = p.project_id
            JOIN Users s ON r.student_id = s.id
            WHERE p.supervisor_id = $1
            ORDER BY r.requested_at DESC
        `;

        const result = await db.query(query, [supervisorId]);
        return result.rows;
    }

    /**
     * Get a specific request
     */
    async getRequestById(requestId) {
        const query = `
            SELECT * FROM Access_Requests_Student
            WHERE request_id = $1
        `;

        const result = await db.query(query, [requestId]);
        return result.rows[0];
    }

    /**
     * Update request status (for supervisors)
     */
    async updateRequestStatus(requestId, status, response) {
        const query = `
            UPDATE Access_Requests_Student
            SET 
                status = $1,
                supervisor_response = $2,
                reviewed_at = CURRENT_TIMESTAMP
            WHERE request_id = $3
            RETURNING *
        `;

        const result = await db.query(query, [status, response, requestId]);
        return result.rows[0];
    }

    /**
     * Delete a request (student can cancel pending requests)
     */
    async deleteRequest(requestId) {
        const query = `
            DELETE FROM Access_Requests_Student
            WHERE request_id = $1
            RETURNING *
        `;

        const result = await db.query(query, [requestId]);
        return result.rows[0];
    }
    /**
     * Check if a student has approved access to a project
     */
    async checkAccess(studentId, projectId) {
        const query = `
            SELECT status FROM Access_Requests_Student
            WHERE student_id = $1 AND project_id = $2
        `;

        const result = await db.query(query, [studentId, projectId]);

        if (result.rows.length === 0) return false;
        return result.rows[0].status === 'Approved';
    }
}

module.exports = new RequestRepository();
