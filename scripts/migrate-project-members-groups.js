const db = require('../Database');

async function migrateProjectMembersTable() {
    console.log('--- Starting Migration: Project_Members Group Columns ---');

    try {
        // Step 1: Check current columns
        const colRes = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'project_members'
            ORDER BY column_name;
        `);
        const existingCols = colRes.rows.map(r => r.column_name);
        console.log('Current columns:', existingCols);

        if (existingCols.length === 0) {
            console.log('Table project_members does not exist. Creating from scratch...');

            // The table references Projects which must exist first.
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
            console.log('✓ Project_Members table created fresh.');
        } else {
            // Step 2: If the table has an id column already (SERIAL), we're fine.
            // If the old table had a composite PK (project_id, student_id) with project_id NOT NULL,
            // we need to drop that constraint first.
            console.log('Table exists. Applying migrations...');

            // Drop old primary key if it was (project_id, student_id) composite
            try {
                await db.query(`
                    ALTER TABLE Project_Members DROP CONSTRAINT IF EXISTS project_members_pkey;
                `);
                console.log('  ✓ Dropped old primary key (if existed).');
            } catch(e) {
                console.log('  ! Could not drop pk:', e.message);
            }

            // Add SERIAL id column if it doesn't exist
            if (!existingCols.includes('id')) {
                await db.query(`ALTER TABLE Project_Members ADD COLUMN IF NOT EXISTS id SERIAL;`);
                await db.query(`ALTER TABLE Project_Members ADD PRIMARY KEY (id);`);
                console.log('  ✓ Added id SERIAL PRIMARY KEY.');
            }

            // Make project_id nullable (groups may exist before a project is created)
            try {
                await db.query(`ALTER TABLE Project_Members ALTER COLUMN project_id DROP NOT NULL;`);
                console.log('  ✓ Made project_id nullable.');
            } catch(e) {
                console.log('  ! project_id already nullable or error:', e.message);
            }

            // Add group_number
            if (!existingCols.includes('group_number')) {
                await db.query(`ALTER TABLE Project_Members ADD COLUMN group_number INT;`);
                console.log('  ✓ Added group_number column.');
            } else {
                console.log('  - group_number already exists. Skipping.');
            }

            // Add year
            if (!existingCols.includes('year')) {
                await db.query(`ALTER TABLE Project_Members ADD COLUMN year INT;`);
                console.log('  ✓ Added year column.');
            } else {
                console.log('  - year already exists. Skipping.');
            }

            // Add assigned_by
            if (!existingCols.includes('assigned_by')) {
                await db.query(`
                    ALTER TABLE Project_Members 
                    ADD COLUMN assigned_by INT REFERENCES Users(id) ON DELETE SET NULL;
                `);
                console.log('  ✓ Added assigned_by column.');
            } else {
                console.log('  - assigned_by already exists. Skipping.');
            }
        }

        // Step 3: Add unique constraint on (student_id, year)
        try {
            await db.query(`
                ALTER TABLE Project_Members 
                DROP CONSTRAINT IF EXISTS project_members_student_id_year_key;
            `);
            await db.query(`
                ALTER TABLE Project_Members 
                ADD CONSTRAINT project_members_student_id_year_key UNIQUE(student_id, year);
            `);
            console.log('✓ Unique constraint (student_id, year) ensured.');
        } catch(e) {
            console.log('! Unique constraint error:', e.message);
        }

        // Step 4: Add student lookup index
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_project_members_student ON Project_Members(student_id);
        `);
        console.log('✓ Index on student_id ensured.');

        // Final verification
        const verifyRes = await db.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'project_members'
            ORDER BY column_name;
        `);
        console.log('\n--- Final Project_Members Schema ---');
        console.table(verifyRes.rows);

        console.log('\n✅ Migration completed successfully!');
    } catch (err) {
        console.error('\n❌ Migration failed:', err);
        throw err;
    }
}

migrateProjectMembersTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
