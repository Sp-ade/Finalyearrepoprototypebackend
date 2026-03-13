const db = require('./Database');

async function createRequestTable() {
    try {
        console.log('Creating Access_Requests_Student table...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS Access_Requests_Student (
                request_id SERIAL PRIMARY KEY,
                student_id INT REFERENCES Users(id) ON DELETE CASCADE,
                project_id INT REFERENCES Projects(project_id) ON DELETE CASCADE,
                request_reason TEXT,
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                supervisor_response TEXT,
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP,
                mode VARCHAR(20) DEFAULT 'view' CHECK (mode IN ('view', 'edit')),
                UNIQUE(student_id, project_id, mode)
            );
        `);

        console.log('✓ Access_Requests_Student table created successfully');

        // Create indexes
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_requests_student ON Access_Requests_Student(student_id);
            CREATE INDEX IF NOT EXISTS idx_requests_project ON Access_Requests_Student(project_id);
            CREATE INDEX IF NOT EXISTS idx_requests_status ON Access_Requests_Student(status);
        `);
        console.log('✓ Indexes created');

    } catch (error) {
        console.error('❌ Error creating request table:', error);
        throw error;
    }
}

if (require.main === module) {
    createRequestTable()
        .then(() => {
            console.log('Database setup complete!');
            process.exit(0);
        })
        .catch(err => {
            console.error('Database setup failed:', err);
            process.exit(1);
        });
}

module.exports = createRequestTable;
