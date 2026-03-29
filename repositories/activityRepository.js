const db = require('../Database');

class ActivityRepository {
    /**
     * Create a new activity log entry
     */
    async createLog(projectId, userId, actionType, description) {
        const query = `
            INSERT INTO activity_logs (project_id, user_id, action_type, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await db.query(query, [projectId, userId, actionType, description]);
        return result.rows[0];
    }

    /**
     * Get all logs for a specific project
     */
    async getLogsByProject(projectId) {
        const query = `
            SELECT 
                al.*,
                u.first_name || ' ' || u.last_name as performer_name,
                u.role as performer_role
            FROM activity_logs al
            LEFT JOIN Users u ON al.user_id = u.id
            WHERE al.project_id = $1
            ORDER BY al.created_at DESC
        `;
        const result = await db.query(query, [projectId]);
        return result.rows;
    }

    /**
     * Get global recent activity (for admin dashboard)
     */
    async getGlobalRecentActivity(limit = 10) {
        const query = `
            SELECT 
                al.*,
                u.first_name || ' ' || u.last_name as performer_name,
                p.title as project_title
            FROM activity_logs al
            LEFT JOIN Users u ON al.user_id = u.id
            LEFT JOIN Projects p ON al.project_id = p.project_id
            ORDER BY al.created_at DESC
            LIMIT $1
        `;
        const result = await db.query(query, [limit]);
        return result.rows;
    }

    /**
     * Get paginated global logs with optional filters
     */
    async getPaginatedLogs(limit = 50, offset = 0, filters = {}) {
        const { search, actionType, role } = filters;
        
        // Base joins and selections
        let selectQuery = `
            SELECT 
                al.*,
                u.first_name || ' ' || u.last_name as performer_name,
                u.role as performer_role,
                p.title as project_title
            FROM activity_logs al
            LEFT JOIN Users u ON al.user_id = u.id
            LEFT JOIN Projects p ON al.project_id = p.project_id
            WHERE 1=1
        `;
        
        let countQuery = `
            SELECT COUNT(*) 
            FROM activity_logs al
            LEFT JOIN Users u ON al.user_id = u.id
            LEFT JOIN Projects p ON al.project_id = p.project_id
            WHERE 1=1
        `;

        const values = [];
        let paramIndex = 1;

        if (search) {
            const searchClause = ` AND (u.first_name || ' ' || u.last_name ILIKE $${paramIndex} OR p.title ILIKE $${paramIndex})`;
            selectQuery += searchClause;
            countQuery += searchClause;
            values.push(`%${search}%`);
            paramIndex++;
        }

        if (actionType) {
            selectQuery += ` AND al.action_type = $${paramIndex}`;
            countQuery += ` AND al.action_type = $${paramIndex}`;
            values.push(actionType);
            paramIndex++;
        }

        if (role) {
            selectQuery += ` AND u.role = $${paramIndex}`;
            countQuery += ` AND u.role = $${paramIndex}`;
            values.push(role);
            paramIndex++;
        }

        selectQuery += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        // Push pagination limits specifically for the select query
        const selectValues = [...values, limit, offset];

        const [result, countResult] = await Promise.all([
            db.query(selectQuery, selectValues),
            db.query(countQuery, values) // count query only uses the filter values
        ]);

        return {
            logs: result.rows,
            total: parseInt(countResult.rows[0].count)
        };
    }

    /**
     * Get unique action types from the logs
     */
    async getDistinctActionTypes() {
        const query = 'SELECT DISTINCT action_type FROM activity_logs ORDER BY action_type ASC';
        const result = await db.query(query);
        return result.rows.map(row => row.action_type);
    }
}

module.exports = new ActivityRepository();
