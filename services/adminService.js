const db = require('../Database');

class AdminService {
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
                u.last_login,
                CASE 
                    WHEN u.role = 'student' THEN s.matric_no
                    WHEN u.role = 'supervisor' THEN st.staff_id
                    WHEN u.role = 'admin' THEN a.admin_level
                    ELSE NULL
                END as identifier,
                CASE 
                    WHEN u.role = 'student' THEN s.department
                    WHEN u.role = 'supervisor' THEN st.department
                    ELSE NULL
                END as department,
                a.admin_level
            FROM Users u
            LEFT JOIN Students s ON u.id = s.user_id
            LEFT JOIN Staff st ON u.id = st.user_id
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

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM Users u WHERE 1=1';
        const countValues = [];
        let countParamCount = 1;

        if (role) {
            countQuery += ` AND u.role = $${countParamCount}`;
            countValues.push(role);
            countParamCount++;
        }

        if (search) {
            countQuery += ` AND (
                u.email ILIKE $${countParamCount} OR 
                u.first_name ILIKE $${countParamCount} OR 
                u.last_name ILIKE $${countParamCount}
            )`;
            countValues.push(`%${search}%`);
        }

        const countResult = await db.query(countQuery, countValues);

        return {
            success: true,
            users: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit,
            offset
        };
    }

    /**
     * Get user statistics
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
        return {
            success: true,
            stats: result.rows[0]
        };
    }

    /**
     * Update user status (activate/deactivate)
     */
    async updateUserStatus(userId, isActive) {
        const query = `
            UPDATE Users
            SET is_active = $1
            WHERE id = $2
            RETURNING id, email, first_name, last_name, role, is_active
        `;

        const result = await db.query(query, [isActive, userId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        return {
            success: true,
            user: result.rows[0]
        };
    }

    /**
     * Get project statistics
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

        // Get projects by category
        const categoryQuery = `
            SELECT department as category, COUNT(*) as count
            FROM Projects
            GROUP BY department
            ORDER BY count DESC
        `;
        const categoryResult = await db.query(categoryQuery);

        return {
            success: true,
            stats: {
                ...result.rows[0],
                by_category: categoryResult.rows
            }
        };
    }

    /**
     * Get request statistics
     */
    async getRequestStats() {
        const query = `
            SELECT 
                COUNT(*) as total_requests,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
                COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
                COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests
            FROM Requests
        `;

        const result = await db.query(query);
        return {
            success: true,
            stats: result.rows[0]
        };
    }

    /**
     * Get all requests with filtering
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
            FROM Requests r
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

        query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        const result = await db.query(query, values);

        return {
            success: true,
            requests: result.rows
        };
    }

    /**
     * Get dashboard analytics
     */
    async getDashboardAnalytics() {
        const [userStats, projectStats, requestStats] = await Promise.all([
            this.getUserStats(),
            this.getProjectStats(),
            this.getRequestStats()
        ]);

        // Get recent activity (last 10 actions)
        const activityQuery = `
            (SELECT 'user_registered' as action, email as details, created_at FROM Users ORDER BY created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'project_created' as action, title as details, created_at FROM Projects ORDER BY created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'request_submitted' as action, CAST(request_id AS TEXT) as details, created_at FROM Requests ORDER BY created_at DESC LIMIT 5)
            ORDER BY created_at DESC
            LIMIT 10
        `;

        const activityResult = await db.query(activityQuery);

        return {
            success: true,
            analytics: {
                users: userStats.stats,
                projects: projectStats.stats,
                requests: requestStats.stats,
                recent_activity: activityResult.rows
            }
        };
    }

    /**
     * Get all tags with usage count
     */
    async getAllTags() {
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
        return {
            success: true,
            tags: result.rows
        };
    }

    /**
     * Update tag name
     */
    async updateTag(tagId, newName) {
        const query = `
            UPDATE Tags
            SET name = $1
            WHERE tag_id = $2
            RETURNING *
        `;

        const result = await db.query(query, [newName.toLowerCase().trim(), tagId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Tag not found'
            };
        }

        return {
            success: true,
            tag: result.rows[0]
        };
    }

    /**
     * Delete tag
     */
    async deleteTag(tagId) {
        // First delete all project-tag associations
        await db.query('DELETE FROM Project_Tags WHERE tag_id = $1', [tagId]);

        // Then delete the tag
        const query = 'DELETE FROM Tags WHERE tag_id = $1 RETURNING *';
        const result = await db.query(query, [tagId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                message: 'Tag not found'
            };
        }

        return {
            success: true,
            message: 'Tag deleted successfully'
        };
    }
}

module.exports = new AdminService();
