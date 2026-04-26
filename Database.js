const { Pool } = require('pg')
require('dotenv').config()

// Use DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  async init() {
    // Create Users table (parent table) with all columns needed for auth/verification
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Users(
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'supervisor', 'admin')),
        CONSTRAINT email_from_nile CHECK (
          email LIKE '%@nileuniversity.edu.ng'
        ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        -- verification support
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_expires TIMESTAMP
      );
    `)

    // if table already existed before we added verification columns, make sure they exist
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
    `)
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
    `)
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;
    `)
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
    `)
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP;
    `)

    // Create Students table (child table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Students (
        user_id INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE,
        student_matric_no VARCHAR(11) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'member' NOT NULL CHECK (role IN ('leader', 'member')),
        leader_assigned_by INTEGER REFERENCES Users(id) ON DELETE SET NULL
      );
    `)

    // Create Supervisors table (child table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Supervisors (
        user_id INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE,
        staff_id VARCHAR(50) UNIQUE NOT NULL
      );
    `)

    // Create admins table (child table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        user_id INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE,
        admin_level VARCHAR(20) DEFAULT 'Standard' -- e.g., 'SuperAdmin', 'Moderator'
      );
    `)

    // Create Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Notifications(
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        type VARCHAR(50),
        source_id INTEGER,
        source_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Ensure columns exist if table was previously created
    await pool.query(`
      ALTER TABLE Notifications
      ADD COLUMN IF NOT EXISTS source_id INTEGER;
    `)
    await pool.query(`
      ALTER TABLE Notifications
      ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
    `)
  },
  async createUser(
    email,
    passwordHash,
    firstName,
    lastName,
    role = 'student',
    roleSpecificId,
    department = null,
    verificationToken,
    verificationExpiry) {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Insert into Users table with verification fields
      const userRes = await client.query(
        `INSERT INTO Users 
        (email, password_hash, first_name, last_name, role, is_verified, verification_token, verification_expires) 
       VALUES ($1, $2, $3, $4, $5, false, $6, $7)
       ON CONFLICT (email) DO NOTHING 
       RETURNING *`,
        [
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          verificationToken,
          verificationExpiry
        ]
      )

      if (!userRes.rows[0]) {
        await client.query('ROLLBACK')
        return null
      }

      const user = userRes.rows[0]

      // Insert into role-specific table
      if (role === 'student') {
        await client.query(
          `INSERT INTO Students (user_id, student_matric_no, department) 
         VALUES ($1, $2, $3)`,
          [user.id, roleSpecificId, department || 'Not Specified']
        )
      } else if (role === 'supervisor') {
        await client.query(
          `INSERT INTO Supervisors (user_id, staff_id) 
         VALUES ($1, $2)`,
          [user.id, roleSpecificId]
        )
      } else if (role === 'admin') {
        await client.query(
          `INSERT INTO admins (user_id) 
         VALUES ($1)`,
          [user.id]
        )
      }

      await client.query('COMMIT')
      return user

    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
  async findUserByEmail(email) {
    const res = await pool.query('SELECT * FROM Users WHERE email = $1', [email])
    return res.rows[0]
  },
  async ensureRequestModeColumn() {
    try {
      await pool.query(`
        ALTER TABLE Access_Requests_Student 
        ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'view' CHECK (mode IN ('view', 'edit'));
      `);

      // Update UNIQUE constraint to include mode
      // First drop old constraint if it exists (might be named by Postgres automatically)
      // Usually it's access_requests_student_student_id_project_id_key
      await pool.query(`
        ALTER TABLE Access_Requests_Student 
        DROP CONSTRAINT IF EXISTS access_requests_student_student_id_project_id_key;
      `);

      await pool.query(`
        ALTER TABLE Access_Requests_Student 
        ADD CONSTRAINT access_requests_student_student_id_project_id_mode_key UNIQUE(student_id, project_id, mode);
      `);
    } catch (err) {
      console.warn('Note: Request mode column/constraint update check finished (might have existed).');
    }
  },
  async ensureLeaderAssignedByColumn() {
    try {
      await pool.query(`
        ALTER TABLE Students 
        ADD COLUMN IF NOT EXISTS leader_assigned_by INTEGER REFERENCES Users(id) ON DELETE SET NULL;
      `);
    } catch (err) {
      console.warn('Note: leader_assigned_by column update check finished.');
    }
  },
  async ensureStaffPermissionsTable() {
    // Must run AFTER Projects table is created (Step 2 in initialize-database.js)
    try {
      // Check if project_id exists. If not, the table is likely from a partial run and needs fixing.
      const checkRes = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'staff_permissions' AND column_name = 'project_id'
      `);

      if (checkRes.rows.length === 0) {
        console.log('⚠️ Staff_Permissions table is missing project_id. Resetting table...');
        await pool.query('DROP TABLE IF EXISTS Staff_Permissions');
      }

      await pool.query(`
        CREATE TABLE IF NOT EXISTS Staff_Permissions (
          permission_id  SERIAL PRIMARY KEY,
          supervisor_id  INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
          project_id     INTEGER NOT NULL REFERENCES Projects(project_id) ON DELETE CASCADE,
          type           VARCHAR(20) NOT NULL DEFAULT 'edit' CHECK (type IN ('edit', 'delete')),
          reason         TEXT,
          status         VARCHAR(20) NOT NULL DEFAULT 'Pending'
                         CHECK (status IN ('Pending', 'Approved', 'Rejected')),
          requested_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_at    TIMESTAMP,
          UNIQUE (supervisor_id, project_id, type)
        );
      `);

      // Migration: ensuring columns and constraint if table already exists
      await pool.query(`
        ALTER TABLE Staff_Permissions
        ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'edit' CHECK (type IN ('edit', 'delete'));
      `);

      // Drop old unique constraint if it exists (the one without 'type')
      await pool.query(`
        ALTER TABLE Staff_Permissions 
        DROP CONSTRAINT IF EXISTS staff_permissions_supervisor_id_project_id_key;
      `);

      // Add new unique constraint
      await pool.query(`
        ALTER TABLE Staff_Permissions 
        ADD CONSTRAINT staff_permissions_supervisor_id_project_id_type_key UNIQUE(supervisor_id, project_id, type);
      `);

      console.log('✓ Staff_Permissions table ready');
    } catch (err) {
      console.error('❌ Error initializing Staff_Permissions table:', err.message);
    }
  }
}
