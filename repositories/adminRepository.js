const db = require('../Database');

class AdminRepository {
    /**
     * Get all users with optional filtering
     */
    async getAllUsers(filters = {}) {
        const { role, search, limit = 100, offset = 0 } = filters;

        let query = `
            SELECT 
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.role,
                u.is_active,
                u.created_at,
                CASE 
                    WHEN u.role = 'student' THEN s.student_matric_no
                    WHEN u.role = 'supervisor' THEN sup.staff_id
                    WHEN u.role = 'admin' THEN a.admin_level
                    ELSE NULL
                END as identifier,
                CASE 
                    WHEN u.role = 'student' THEN s.department
                    WHEN u.role = 'supervisor' THEN NULL
                    ELSE NULL
                END as department,
                s.role as student_role,
                a.admin_level
            FROM Users u
            LEFT JOIN Students s ON u.id = s.user_id
            LEFT JOIN Supervisors sup ON u.id = sup.user_id
            LEFT JOIN admins a ON u.id = a.user_id
            WHERE 1=1
        `;

        const values = [];
        let paramCount = 1;

        if (role) {
            query += ` AND u.role = $${paramCount}`;
            values.push(role);
            paramCount++;
        }

        if (search) {
            query += ` AND (
                u.email ILIKE $${paramCount} OR 
                u.first_name ILIKE $${paramCount} OR 
                u.last_name ILIKE $${paramCount}
            )`;
            values.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        const result = await db.query(query, values);
        return result.rows;
    }

    /**
     * Get total count of users with filters
     */
    async getUserCount(filters = {}) {
        const { role, search } = filters;
        let query = 'SELECT COUNT(*) FROM Users u WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (role) {
            query += ` AND u.role = $${paramCount}`;
            values.push(role);
            paramCount++;
        }

        if (search) {
            query += ` AND (
                u.email ILIKE $${paramCount} OR 
                u.first_name ILIKE $${paramCount} OR 
                u.last_name ILIKE $${paramCount}
            )`;
            values.push(`%${search}%`);
        }

        const result = await db.query(query, values);
        return parseInt(result.rows[0].count);
    }

    /**
     * Get user role distribution and status stats
     */
    async getUserStats() {
        const query = `
            SELECT 
                COUNT(*) FILTER (WHERE role = 'student') as total_students,
                COUNT(*) FILTER (WHERE role = 'supervisor') as total_supervisors,
                COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
                COUNT(*) FILTER (WHERE is_active = true) as active_users,
                COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
                COUNT(*) as total_users
            FROM Users
        `;
        const result = await db.query(query);
        return result.rows[0];
    }

    /**
     * Update user activity status
     */
    async updateUserStatus(userId, isActive) {
        let query;
        if (isActive === false) {
            query = `
                UPDATE Users
                SET is_active = false,
                    is_verified = false,
                    verification_token = NULL,
                    verification_expires = NULL
                WHERE id = $1
                RETURNING id, email, role, is_active
            `;
        } else {
            query = `
                UPDATE Users
                SET is_active = true
                WHERE id = $1
                RETURNING id, email, role, is_active
            `;
        }
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }

    /**
     * Get high-level project statistics
     */
    async getProjectStats() {
        const query = `
            SELECT 
                COUNT(*) as total_projects,
                COUNT(*) FILTER (WHERE status = 'Active') as active_projects,
                COUNT(*) FILTER (WHERE status = 'Completed') as completed_projects,
                COUNT(DISTINCT department) as total_departments,
                COUNT(DISTINCT academic_year) as total_years
            FROM Projects
        `;
        const result = await db.query(query);
        return result.rows[0];
    }

    /**
     * Get project counts by category (department)
     */
    async getProjectsByCategory() {
        const query = `
            SELECT department as category, COUNT(*) as count
            FROM Projects
            GROUP BY department
            ORDER BY count DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Get access request statistics
     */
    async getRequestStats() {
        const query = `
            SELECT 
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE status = 'Pending') as pending_requests,
                COUNT(*) FILTER (WHERE status = 'Approved') as approved_requests,
                COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_requests
            FROM Access_Requests_Student
        `;
        const result = await db.query(query);
        return result.rows[0];
    }

    /**
     * Get all access requests with student and project info
     */
    async getAllRequests(filters = {}) {
        const { status, limit = 50, offset = 0 } = filters;

        let query = `
            SELECT 
                r.*,
                u.email as student_email,
                u.first_name || ' ' || u.last_name as student_name,
                p.title as project_title,
                sup.first_name || ' ' || sup.last_name as supervisor_name
            FROM Access_Requests_Student r
            JOIN Users u ON r.student_id = u.id
            JOIN Projects p ON r.project_id = p.project_id
            LEFT JOIN Users sup ON p.supervisor_id = sup.id
            WHERE 1=1
        `;

        const values = [];
        let paramCount = 1;

        if (status) {
            query += ` AND r.status = $${paramCount}`;
            values.push(status);
            paramCount++;
        }

        query += ` ORDER BY r.requested_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        const result = await db.query(query, values);
        return result.rows;
    }

    /**
     * Get all tags with usage count
     */
    async getAllTagsWithUsage() {
        const query = `
            SELECT 
                t.tag_id,
                t.name,
                COUNT(pt.project_id) as usage_count
            FROM Tags t
            LEFT JOIN Project_Tags pt ON t.tag_id = pt.tag_id
            GROUP BY t.tag_id, t.name
            ORDER BY usage_count DESC, t.name ASC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Update a tag's name
     */
    async updateTag(tagId, newName) {
        const query = `
            UPDATE Tags
            SET name = $1
            WHERE tag_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [newName.toLowerCase().trim(), tagId]);
        return result.rows[0];
    }

    /**
     * Delete a tag and its associations
     */
    async deleteTag(tagId) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM Project_Tags WHERE tag_id = $1', [tagId]);
            const result = await client.query('DELETE FROM Tags WHERE tag_id = $1 RETURNING *', [tagId]);
            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Demote a student leader to member
     */
    async demoteStudentLeader(studentUserId) {
        const query = `
            UPDATE Students 
            SET role = 'member', leader_assigned_by = NULL 
            WHERE user_id = $1 
            RETURNING *
        `;
        const result = await db.query(query, [studentUserId]);
        return result.rows[0];
    }

    /**
     * Disband a group: delete all group rows and reset student roles
     */
    async disbandGroup(groupNumber, year) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Find all student_ids in this group
            const membersRes = await client.query(
                'SELECT student_id FROM Project_Members WHERE group_number = $1 AND year = $2',
                [groupNumber, year]
            );
            const memberIds = membersRes.rows.map(r => r.student_id);

            // 2. Delete the group rows
            await client.query(
                'DELETE FROM Project_Members WHERE group_number = $1 AND year = $2',
                [groupNumber, year]
            );

            // 3. Reset Students.role to 'member' for those students
            if (memberIds.length > 0) {
                await client.query(
                    `UPDATE Students SET role = 'member', leader_assigned_by = NULL WHERE user_id = ANY($1::int[])`,
                    [memberIds]
                );
            }

            await client.query('COMMIT');
            return { disbandedCount: memberIds.length, memberIds };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Admin Override: Update an existing group's details and potentially reassign supervisor.
     */
    async adminUpdateGroup(groupNumber, year, leaderId, memberIds, newSupervisorId) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Identify all current members to reset roles
            const currentMembersRes = await client.query(
                'SELECT student_id FROM Project_Members WHERE group_number = $1 AND year = $2',
                [groupNumber, year]
            );
            const currentMemberIds = currentMembersRes.rows.map(r => r.student_id);

            // 2. Delete all existing members for this group
            await client.query(
                'DELETE FROM Project_Members WHERE group_number = $1 AND year = $2',
                [groupNumber, year]
            );

            // 3. Reset roles for all previous members
            if (currentMemberIds.length > 0) {
                await client.query(
                    `UPDATE Students SET role = 'member', leader_assigned_by = NULL WHERE user_id = ANY($1::int[])`,
                    [currentMemberIds]
                );
            }

            // 4. Insert/Update the new leader
            await client.query(`
                INSERT INTO Project_Members (student_id, role, group_number, year, assigned_by)
                VALUES ($1, 'Leader', $2, $3, $4)
                ON CONFLICT (student_id, year) DO UPDATE 
                SET role = 'Leader', group_number = $2, assigned_by = $4
            `, [leaderId, groupNumber, year, newSupervisorId]);

            // 5. Insert/Update the new members
            if (memberIds && memberIds.length > 0) {
                for (const memberId of memberIds) {
                    await client.query(`
                        INSERT INTO Project_Members (student_id, role, group_number, year, assigned_by)
                        VALUES ($1, 'Member', $2, $3, $4)
                        ON CONFLICT (student_id, year) DO UPDATE 
                        SET role = 'Member', group_number = $2, assigned_by = $4
                    `, [memberId, groupNumber, year, newSupervisorId]);
                }
            }

            // 6. Update Students table for the new leader
            await client.query(`
                UPDATE Students SET role = 'leader', leader_assigned_by = $1 WHERE user_id = $2
            `, [newSupervisorId, leaderId]);

            await client.query('COMMIT');
            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}

module.exports = new AdminRepository();
