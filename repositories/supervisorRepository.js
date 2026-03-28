const db = require('../Database');

class SupervisorRepository {
    /**
     * Get all students with their matric numbers
     */
    async getAllStudents() {
        const query = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.email, 
                s.student_matric_no, 
                s.department, 
                s.role,
                s.leader_assigned_by,
                sv.first_name as supervisor_first_name,
                sv.last_name as supervisor_last_name
            FROM Users u
            JOIN Students s ON u.id = s.user_id
            LEFT JOIN Users sv ON s.leader_assigned_by = sv.id
            WHERE u.role = 'student'
            ORDER BY u.first_name ASC, u.last_name ASC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Get user role by ID
     */
    async getUserRole(userId) {
        const query = 'SELECT role FROM Users WHERE id = $1';
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }

    /**
     * Update student role in Students table
     */
    async updateStudentRole(userId, role, assignedBy = null) {
        const query = `
            UPDATE Students 
            SET role = $1, leader_assigned_by = $2 
            WHERE user_id = $3 
            RETURNING *
        `;
        const result = await db.query(query, [role, assignedBy, userId]);
        return result.rows[0];
    }

    /**
     * Get a specific student by user ID with leader info
     */
    async getStudentById(userId) {
        const query = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.email, 
                s.student_matric_no, 
                s.department, 
                s.role,
                s.leader_assigned_by,
                sv.first_name as supervisor_first_name,
                sv.last_name as supervisor_last_name
            FROM Users u
            JOIN Students s ON u.id = s.user_id
            LEFT JOIN Users sv ON s.leader_assigned_by = sv.id
            WHERE u.id = $1 AND u.role = 'student'
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }

    /**
     * Reassign the supervisor for a student leader
     */
    async reassignLeaderSupervisor(studentUserId, newSupervisorId) {
        const query = `
            UPDATE Students 
            SET leader_assigned_by = $1 
            WHERE user_id = $2 
        `;
        await db.query(query, [newSupervisorId, studentUserId]);
        // Return full student object with names
        return await this.getStudentById(studentUserId);
    }
}

module.exports = new SupervisorRepository();
