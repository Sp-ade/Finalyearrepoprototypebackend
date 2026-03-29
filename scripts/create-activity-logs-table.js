const db = require('../Database');

async function createActivityLogsTable() {
    try {
        console.log('Creating activity_logs table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                log_id SERIAL PRIMARY KEY,
                project_id INT REFERENCES Projects(project_id) ON DELETE CASCADE,
                user_id INT REFERENCES Users(id) ON DELETE SET NULL,
                action_type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✓ activity_logs table created successfully');

        // Create index for performance
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON activity_logs(project_id);
        `);
        console.log('✓ Index for activity_logs created');

    } catch (error) {
        console.error('❌ Error creating activity_logs table:', error);
        throw error;
    }
}

if (require.main === module) {
    createActivityLogsTable()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = createActivityLogsTable;
