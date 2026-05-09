const db = require('../Database');

class SupervisorRepository {
    /**
     * Check if a student is currently part of any project
     */
    async checkStudentProjectMembership(userId) {
        const query = 'SELECT 1 FROM Project_Members WHERE student_id = $1 AND project_id IS NOT NULL LIMIT 1';
        const result = await db.query(query, [userId]);
        return result.rows.length > 0;
    }

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
                sv.last_name as supervisor_last_name,
                pm.group_number,
                pm.year
            FROM Users u
            JOIN Students s ON u.id = s.user_id
            LEFT JOIN Users sv ON s.leader_assigned_by = sv.id
            LEFT JOIN LATERAL (
                SELECT group_number, year
                FROM Project_Members
                WHERE student_id = u.id
                ORDER BY year DESC
                LIMIT 1
            ) pm ON true
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
        `;
        await db.query(query, [role, assignedBy, userId]);
        // Return full student object with joined names
        return await this.getStudentById(userId);
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
                sv.last_name as supervisor_last_name,
                pm.group_number,
                pm.year
            FROM Users u
            JOIN Students s ON u.id = s.user_id
            LEFT JOIN Users sv ON s.leader_assigned_by = sv.id
            LEFT JOIN LATERAL (
                SELECT group_number, year
                FROM Project_Members
                WHERE student_id = u.id
                ORDER BY year DESC
                LIMIT 1
            ) pm ON true
            WHERE u.id = $1 AND u.role = 'student'
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }

    /**
     * Get multiple students by their user IDs
     */
    async getStudentsByIds(userIds) {
        if (!userIds || userIds.length === 0) return [];
        const query = `
            SELECT id, email, first_name, last_name
            FROM Users
            WHERE id = ANY($1) AND role = 'student'
        `;
        const result = await db.query(query, [userIds]);
        return result.rows;
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

    /**
     * Create a group in Project_Members
     */
    async createGroup(leaderId, memberIds, groupNumber, year, supervisorId) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Insert/Update leader
            await client.query(`
                INSERT INTO Project_Members (student_id, role, group_number, year, assigned_by)
                VALUES ($1, 'Leader', $2, $3, $4)
                ON CONFLICT (student_id, year) DO UPDATE 
                SET role = 'Leader', group_number = $2, assigned_by = $4
            `, [leaderId, groupNumber, year, supervisorId]);

            // 2. Insert/Update members
            if (memberIds && memberIds.length > 0) {
                for (const memberId of memberIds) {
                    await client.query(`
                        INSERT INTO Project_Members (student_id, role, group_number, year, assigned_by)
                        VALUES ($1, 'Member', $2, $3, $4)
                        ON CONFLICT (student_id, year) DO UPDATE 
                        SET role = 'Member', group_number = $2, assigned_by = $4
                    `, [memberId, groupNumber, year, supervisorId]);
                }
            }

            // 3. Update Students table for leader role (for compatibility)
            await client.query(`
                UPDATE Students SET role = 'leader', leader_assigned_by = $1 WHERE user_id = $2
            `, [supervisorId, leaderId]);

            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Delete a group or unassign members
     */
    async deleteGroup(studentId) {
        // Look up the actual year from the database (don't assume current year)
        const groupRes = await db.query(
            'SELECT group_number, year FROM Project_Members WHERE student_id = $1 AND project_id IS NULL ORDER BY year DESC LIMIT 1',
            [studentId]
        );

        if (groupRes.rows.length > 0) {
            const { group_number, year } = groupRes.rows[0];
            // Delete all pre-project group rows for this group/year
            await db.query(
                'DELETE FROM Project_Members WHERE group_number = $1 AND year = $2 AND project_id IS NULL',
                [group_number, year]
            );
        }
    }

    /**
     * Check if a group_number is already taken for a given year and department.
     * A conflict exists when another group with the same number + year already has
     * at least one member from the same department.
     * @returns {string|null} The department name if conflict found, null otherwise.
     */
    async checkGroupNumberConflict(groupNumber, year, department) {
        const query = `
            SELECT 1
            FROM Project_Members pm
            JOIN Students s ON pm.student_id = s.user_id
            WHERE pm.group_number = $1
              AND pm.year         = $2
              AND s.department    = $3
            LIMIT 1
        `;
        const result = await db.query(query, [groupNumber, year, department]);
        return result.rows.length > 0;
    }
}

module.exports = new SupervisorRepository();
