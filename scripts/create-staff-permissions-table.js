/**
 * Migration script: creates the Staff_Permissions table.
 * Run once with: node Backend/scripts/create-staff-permissions-table.js
 */
require('dotenv').config()
const db = require('../Database')

async function run() {
    try {
        await db.pool.query(`
            CREATE TABLE IF NOT EXISTS Staff_Permissions (
                permission_id  SERIAL PRIMARY KEY,
                supervisor_id  INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
                project_id     INTEGER NOT NULL REFERENCES Projects(project_id) ON DELETE CASCADE,
                reason         TEXT,
                status         VARCHAR(20) NOT NULL DEFAULT 'Pending'
                               CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                requested_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at    TIMESTAMP,
                UNIQUE (supervisor_id, project_id)
            );
        `)
        console.log('✅ Staff_Permissions table created (or already existed)')
        process.exit(0)
    } catch (err) {
        console.error('❌ Error creating Staff_Permissions table:', err)
        process.exit(1)
    }
}

run()
