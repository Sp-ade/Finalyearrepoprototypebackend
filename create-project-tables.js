const db = require('./Database');

async function createProjectTables() {
    try {
        console.log('Creating project-related tables...');

        // Create Supervisors table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS Supervisors (
                user_id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                department VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Supervisors table created/verified');

        // Create Projects table
        await db.query(`
            CREATE TABLE IF NOT EXISTS Projects (
                project_id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                department VARCHAR(100) NOT NULL,
                category VARCHAR(50),
                academic_year VARCHAR(20) NOT NULL,
                grade VARCHAR(7),
                status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Archived', 'Pending')),
                
                supervisor_id INT REFERENCES Users(id) ON DELETE SET NULL,
                
                supervisor_remark TEXT, 
                
                edit_approved BOOLEAN DEFAULT FALSE,
                student_names TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✓ Projects table created');

        // Create Project_Artifacts table
        await db.query(`
            CREATE TABLE IF NOT EXISTS Project_Artifacts (
                project_id INT REFERENCES Projects(project_id) ON DELETE CASCADE,
                artifact_id SERIAL,
                
                file_name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_type VARCHAR(50),
                
                uploaded_by INT REFERENCES Supervisors(user_id), 
                
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_public BOOLEAN DEFAULT FALSE,

                PRIMARY KEY (project_id, artifact_id)
            );
        `);
        console.log('✓ Project_Artifacts table created');

        // Create Tags table
        await db.query(`
            CREATE TABLE IF NOT EXISTS Tags (
                tag_id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL
            );
        `);
        console.log('✓ Tags table created');

        // Create Project_Tags junction table
        await db.query(`
            CREATE TABLE IF NOT EXISTS Project_Tags (
                project_id INT REFERENCES Projects(project_id) ON DELETE CASCADE,
                tag_id INT REFERENCES Tags(tag_id) ON DELETE CASCADE,
                PRIMARY KEY (project_id, tag_id)
            );
        `);
        console.log('✓ Project_Tags table created');

        // Create indexes for better performance
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_projects_supervisor ON Projects(supervisor_id);
            CREATE INDEX IF NOT EXISTS idx_projects_status ON Projects(status);
            CREATE INDEX IF NOT EXISTS idx_artifacts_project ON Project_Artifacts(project_id);
            CREATE INDEX IF NOT EXISTS idx_project_tags_project ON Project_Tags(project_id);
            CREATE INDEX IF NOT EXISTS idx_project_tags_tag ON Project_Tags(tag_id);
        `);
        console.log('✓ Indexes created');

        console.log('\n✅ All project tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    createProjectTables()
        .then(() => {
            console.log('\nDatabase setup complete!');
            process.exit(0);
        })
        .catch(err => {
            console.error('\nDatabase setup failed:', err);
            process.exit(1);
        });
}

module.exports = createProjectTables;
