const db = require('./Database');

async function createSubmissionTable() {
    try {
        console.log('Creating submission-related tables...');

        // Create Project_Submissions table
        await db.query(`
            CREATE TABLE IF NOT EXISTS Project_Submissions (
                submission_id SERIAL PRIMARY KEY,
                
                -- Student who submitted (One project per student)
                student_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE UNIQUE,
                
                -- Project being submitted
                project_id INT NOT NULL REFERENCES Projects(project_id) ON DELETE CASCADE,
                
                
                -- Supervisor is derived from Projects table 

                
                -- Submission metadata
                requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- Validation status
                status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Changes Requested')),
                
                -- Feedback
                supervisor_response TEXT,
                reviewed_at TIMESTAMP
            );
        `);
        console.log('✓ Project_Submissions table created/verified');

        console.log('\n✅ Submission tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating submission tables:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    createSubmissionTable()
        .then(() => {
            console.log('\nDatabase setup complete!');
            process.exit(0);
        })
        .catch(err => {
            console.error('\nDatabase setup failed:', err);
            process.exit(1);
        });
}

module.exports = createSubmissionTable;
