const db = require('../Database');

async function createProjectMembersTable() {
    try {
        console.log('--- Starting Migration: Project_Members Table ---');

        // 1. Create the Project_Members junction table
        await db.query(`
            CREATE TABLE IF NOT EXISTS Project_Members (
                project_id INT REFERENCES Projects(project_id) ON DELETE CASCADE,
                student_id INT REFERENCES Users(id) ON DELETE CASCADE,
                role VARCHAR(20) DEFAULT 'Member' CHECK (role IN ('Leader', 'Member')),
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (project_id, student_id)
            );
        `);
        console.log('✓ Project_Members table created/verified');

        // Create index for faster lookups by student
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_project_members_student ON Project_Members(student_id);
        `);
        console.log('✓ Index created for student lookups');

        // 2. Migrate data from Projects table
        const projectsRes = await db.query('SELECT project_id, student_ids FROM Projects');
        const projects = projectsRes.rows;

        console.log(`Found ${projects.length} projects to migrate student relationships from.`);

        for (const project of projects) {
            let studentIds = [];
            
            if (project.student_ids) {
                try {
                    studentIds = typeof project.student_ids === 'string' 
                        ? JSON.parse(project.student_ids) 
                        : project.student_ids;
                } catch (e) {
                    console.warn(`Could not parse student_ids for project ${project.project_id}: ${project.student_ids}`);
                    continue;
                }
            }

            if (Array.isArray(studentIds) && studentIds.length > 0) {
                for (let i = 0; i < studentIds.length; i++) {
                    const studentId = parseInt(studentIds[i]);
                    if (isNaN(studentId)) continue;

                    // The first student in the list is typically the leader in this system's logic
                    const role = (i === 0) ? 'Leader' : 'Member';

                    try {
                        await db.query(`
                            INSERT INTO Project_Members (project_id, student_id, role)
                            VALUES ($1, $2, $3)
                            ON CONFLICT (project_id, student_id) DO NOTHING
                        `, [project.project_id, studentId, role]);
                    } catch (err) {
                        console.error(`Failed to migrate student ${studentId} for project ${project.project_id}:`, err.message);
                    }
                }
                console.log(`Migrated ${studentIds.length} students for project ${project.project_id}.`);
            }
        }

        console.log('--- Migration: Project_Members Complete! ---');
    } catch (error) {
        console.error('--- Migration: Project_Members Failed! ---', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    createProjectMembersTable()
        .then(() => {
            console.log('Migration script finished successfully.');
            process.exit(0);
        })
        .catch(err => {
            console.error('Migration script failed:', err);
            process.exit(1);
        });
}

module.exports = createProjectMembersTable;
