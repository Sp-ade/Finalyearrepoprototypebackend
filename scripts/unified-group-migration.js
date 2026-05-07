const db = require('../Database');

/**
 * Unified Group Migration Script
 * 
 * This script performs two main actions:
 * 1. Schema Update: Ensures Project_Members table has group_number, year, and assigned_by columns.
 * 2. Role Reset: (Gated by LEADER_MIGRATE=true) Resets legacy student roles and clears pre-project groups.
 * 
 * Usage:
 *   node scripts/unified-group-migration.js
 *   LEADER_MIGRATE=true node scripts/unified-group-migration.js
 */
async function runUnifiedMigration() {
    const isLeaderMigrate = process.env.LEADER_MIGRATE === 'true';

    console.log('--- Starting Unified Group Migration ---');
    console.log(`LEADER_MIGRATE flag: ${isLeaderMigrate}`);

    try {
        // --- PART 1: SCHEMA MIGRATION ---
        console.log('\n[1/2] Checking/Updating Project_Members Schema...');
        
        const colRes = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'project_members'
            ORDER BY column_name;
        `);
        const existingCols = colRes.rows.map(r => r.column_name);

        if (existingCols.length === 0) {
            console.log('Table project_members does not exist. Creating from scratch...');
            await db.query(`
                CREATE TABLE IF NOT EXISTS Project_Members (
                    id SERIAL PRIMARY KEY,
                    project_id INT REFERENCES Projects(project_id) ON DELETE CASCADE,
                    student_id INT REFERENCES Users(id) ON DELETE CASCADE,
                    role VARCHAR(20) DEFAULT 'Member' CHECK (role IN ('Leader', 'Member')),
                    group_number INT,
                    year INT,
                    assigned_by INT REFERENCES Users(id) ON DELETE SET NULL,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✓ Project_Members table created.');
        } else {
            console.log('Table exists. Applying missing columns/constraints...');
            
            // Drop old primary key if it was (project_id, student_id) composite
            try {
                await db.query(`ALTER TABLE Project_Members DROP CONSTRAINT IF EXISTS project_members_pkey;`);
            } catch(e) {}

            if (!existingCols.includes('id')) {
                // If it has project_id and student_id but no id, add it. 
                // We need to handle cases where project_id might be null later.
                await db.query(`ALTER TABLE Project_Members ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;`);
                console.log('✓ Added id SERIAL PRIMARY KEY.');
            }
            
            try {
                await db.query(`ALTER TABLE Project_Members ALTER COLUMN project_id DROP NOT NULL;`);
                console.log('✓ Made project_id nullable.');
            } catch(e) {}

            if (!existingCols.includes('group_number')) {
                await db.query(`ALTER TABLE Project_Members ADD COLUMN group_number INT;`);
                console.log('✓ Added group_number column.');
            }
            if (!existingCols.includes('year')) {
                await db.query(`ALTER TABLE Project_Members ADD COLUMN year INT;`);
                console.log('✓ Added year column.');
            }
            if (!existingCols.includes('assigned_by')) {
                await db.query(`ALTER TABLE Project_Members ADD COLUMN assigned_by INT REFERENCES Users(id) ON DELETE SET NULL;`);
                console.log('✓ Added assigned_by column.');
            }
        }

        // Add unique constraint on (student_id, year)
        try {
            await db.query(`ALTER TABLE Project_Members DROP CONSTRAINT IF EXISTS project_members_student_id_year_key;`);
            await db.query(`ALTER TABLE Project_Members ADD CONSTRAINT project_members_student_id_year_key UNIQUE(student_id, year);`);
            console.log('✓ Unique constraint (student_id, year) ensured.');
        } catch(e) {}

        await db.query(`CREATE INDEX IF NOT EXISTS idx_project_members_student ON Project_Members(student_id);`);
        console.log('✓ Index on student_id ensured.');


        // --- PART 2: LEADER UNASSIGNMENT (Gated) ---
        if (isLeaderMigrate) {
            console.log('\n[2/2] LEADER_MIGRATE=true: Resetting legacy leader roles...');
            
            const countRes = await db.query("SELECT COUNT(*) FROM Students WHERE role = 'leader'");
            const leaderCount = parseInt(countRes.rows[0].count);
            
            if (leaderCount > 0) {
                console.log(`Found ${leaderCount} legacy leaders. Resetting to 'member'...`);
                await db.query(`UPDATE Students SET role = 'member', leader_assigned_by = NULL WHERE role = 'leader'`);
                console.log('✓ Legacy student roles reset.');
            } else {
                console.log('No legacy leaders found.');
            }

            // Also clear pre-project groups to avoid conflicts
            const pmRes = await db.query(`DELETE FROM Project_Members WHERE project_id IS NULL`);
            console.log(`✓ Cleared ${pmRes.rowCount} pre-project entries from Project_Members.`);
        } else {
            console.log('\n[2/2] LEADER_MIGRATE is not true. Skipping role reset.');
        }

        console.log('\n✅ Unified Migration completed successfully!');
    } catch (err) {
        console.error('\n❌ Migration failed:', err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runUnifiedMigration();
