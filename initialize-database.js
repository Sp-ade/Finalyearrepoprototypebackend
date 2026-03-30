const db = require('./Database');
const createProjectTables = require('./create-project-tables');
const createRequestTables = require('./create-request-tables');
const createSubmissionTable = require('./create-submission-table');

async function initializeDatabase() {
    try {
        console.log('🚀 Starting database initialization...\n');

        // Step 1: Create user tables
        console.log('Step 1: Creating user tables...');
        await db.init();
        console.log('✓ User tables created\n');

        // Step 2: Create project tables
        console.log('Step 2: Creating project tables...');
        await createProjectTables();
        const createProjectMembersTable = require('./scripts/create-project-members-table');
        await createProjectMembersTable();
        console.log('✓ Project tables and members created\n');

        // Step 3: Create request tables
        console.log('Step 3: Creating request tables...');
        await createRequestTables();
        await db.ensureRequestModeColumn();
        await db.ensureLeaderAssignedByColumn();
        console.log('✓ Request tables created successfully!\n');

        // Step 4: Create submission tables
        console.log('Step 4: Creating submission tables...');
        await createSubmissionTable();
        console.log('✓ Submission tables created\n');

        // Step 5: Create Staff_Permissions (must come after Projects table in Step 2)
        console.log('Step 5: Creating staff permission tables...');
        await db.ensureStaffPermissionsTable();
        console.log('✓ Staff permission tables ready\n');

        // Step 6: Create activity logs table
        console.log('Step 6: Creating activity logs table...');
        const createActivityLogsTable = require('./scripts/create-activity-logs-table');
        await createActivityLogsTable();
        console.log('✓ Activity logs table created\n');

        console.log('✅ Database initialization complete!');
        console.log('All tables have been created successfully.');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('\n✨ Setup complete! Your database is ready.');
            process.exit(0);
        })
        .catch(err => {
            console.error('\n💥 Setup failed:', err.message);
            process.exit(1);
        });
}

module.exports = initializeDatabase;
