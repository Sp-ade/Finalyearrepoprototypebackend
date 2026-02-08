const db = require('./Database');

async function fixSchema() {
    try {
        console.log('Fixing schema...');

        // 1. Drop existing FK constraint(s) related to supervisor_id
        console.log('Dropping existing FK constraints...');
        await db.query(`
            DO $$ 
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'supervisor_id_fkey') THEN
                    ALTER TABLE Projects DROP CONSTRAINT supervisor_id_fkey;
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projects_supervisor_id_fkey') THEN
                    ALTER TABLE Projects DROP CONSTRAINT projects_supervisor_id_fkey;
                END IF;
            END $$;
        `);

        // 2. Add new FK constraint to Users table
        console.log('Adding new FK to Users table...');
        await db.query(`
            ALTER TABLE Projects
            ADD CONSTRAINT fk_projects_users_supervisor
            FOREIGN KEY (supervisor_id) 
            REFERENCES Users(id) 
            ON DELETE SET NULL;
        `);

        console.log('✓ Schema fixed: Projects now references Users directly.');

        // 3. Verify the user exists (User ID 5 from the error)
        const userRes = await db.query('SELECT id, email, role FROM Users WHERE id = 5');
        if (userRes.rows.length > 0) {
            console.log('✓ Verified User ID 5 exists:', userRes.rows[0]);
        } else {
            console.log('⚠️ User ID 5 does not exist in Users table. You may need to re-login to get a valid ID or re-seed the DB.');
        }

    } catch (err) {
        console.error('❌ Error fixing schema:', err);
    }
}

// Check if running directly
if (require.main === module) {
    fixSchema().then(() => process.exit(0));
}

module.exports = fixSchema;
