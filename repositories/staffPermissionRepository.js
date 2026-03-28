const db = require('../Database');

class StaffPermissionRepository {
    /**
     * Insert a new permission request (or reset a rejected one to Pending).
     */
    async create(supervisorId, projectId, reason, type = 'edit') {
        const query = `
            INSERT INTO Staff_Permissions (supervisor_id, project_id, reason, type, status, requested_at, reviewed_at)
            VALUES ($1, $2, $3, $4, 'Pending', CURRENT_TIMESTAMP, NULL)
            ON CONFLICT (supervisor_id, project_id, type)
            DO UPDATE SET
                reason       = EXCLUDED.reason,
                status       = 'Pending',
                requested_at = CURRENT_TIMESTAMP,
                reviewed_at  = NULL
            RETURNING *
        `;
        const result = await db.query(query, [supervisorId, projectId, reason, type]);
        return result.rows[0];
    }

    /**
     * Fetch a single permission for a supervisor + project.
     */
    async getByProjectAndSupervisor(supervisorId, projectId, type = 'edit') {
        const query = `
            SELECT * FROM Staff_Permissions
            WHERE supervisor_id = $1 AND project_id = $2 AND type = $3
        `;
        const result = await db.query(query, [supervisorId, projectId, type]);
        return result.rows[0] || null;
    }

    /**
     * All permissions for a supervisor (their own request history).
     */
    async getBySupervisor(supervisorId) {
        const query = `
            SELECT sp.*, p.title AS project_title
            FROM Staff_Permissions sp
            JOIN Projects p ON sp.project_id = p.project_id
            WHERE sp.supervisor_id = $1
            ORDER BY sp.requested_at DESC
        `;
        const result = await db.query(query, [supervisorId]);
        return result.rows;
    }

    /**
     * All permissions (admin view), optionally filtered by status.
     */
    async getAll(status = null) {
        const params = [];
        let where = '';
        if (status) {
            params.push(status);
            where = `WHERE sp.status = $1`;
        }

        const query = `
            SELECT
                sp.*,
                p.title AS project_title,
                u.first_name || ' ' || u.last_name AS supervisor_name,
                u.email AS supervisor_email
            FROM Staff_Permissions sp
            JOIN Projects p ON sp.project_id = p.project_id
            JOIN Users u ON sp.supervisor_id = u.id
            ${where}
            ORDER BY sp.requested_at DESC
        `;
        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Update the status of a permission (approve / reject).
     */
    async updateStatus(permissionId, status) {
        const query = `
            UPDATE Staff_Permissions
            SET status = $1, reviewed_at = CURRENT_TIMESTAMP
            WHERE permission_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [status, permissionId]);
        return result.rows[0];
    }
}

module.exports = new StaffPermissionRepository();
