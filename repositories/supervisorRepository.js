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
                s.leader_assigned_by 
            FROM Users u
            JOIN Students s ON u.id = s.user_id
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
}

module.exports = new SupervisorRepository();
