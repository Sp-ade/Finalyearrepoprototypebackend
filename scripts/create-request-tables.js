const db = require('../Database');

async function createRequestTables() {
    try {
        console.log('Creating request-related tables...');

        // Create Access_Requests_Student table
        await db.query(`
            CREATE TABLE IF NOT EXISTS Access_Requests_Student (
                request_id SERIAL PRIMARY KEY,
                
                -- Who is asking?
                student_id INT REFERENCES Users(id) ON DELETE CASCADE,
                
                -- Which project do they want?
                project_id INT REFERENCES Projects(project_id) ON DELETE CASCADE,
                
                -- What is the current state?
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
                
                -- Why do they want it?
                request_reason TEXT,
                
                supervisor_response TEXT,
                
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reviewed_at TIMESTAMP,
                
                -- Distinguish between 'view' and 'edit'
                mode VARCHAR(20) DEFAULT 'view' CHECK (mode IN ('view', 'edit')),

                -- A student can't request the same project twice with the same mode
                UNIQUE(student_id, project_id, mode)
            );
        `);
        console.log('✓ Access_Requests_Student table created/verified');

        // Create indexes
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_requests_student ON Access_Requests_Student(student_id);
            CREATE INDEX IF NOT EXISTS idx_requests_project ON Access_Requests_Student(project_id);
            CREATE INDEX IF NOT EXISTS idx_requests_status ON Access_Requests_Student(status);
        `);
        console.log('✓ Indexes for requests created');

        console.log('\n✅ Request tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating request tables:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    createRequestTables()
        .then(() => {
            console.log('\nDatabase setup complete!');
            process.exit(0);
        })
        .catch(err => {
            console.error('\nDatabase setup failed:', err);
            process.exit(1);
        });
}

module.exports = createRequestTables;
