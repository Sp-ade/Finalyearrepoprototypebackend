const { Pool } = require('pg')
require('dotenv').config()

// Use DATABASE_URL from environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:pgfinalyeartest@localhost:5432/nilefinalyeardb'
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  async init() {
    // Create Users table (parent table)
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
        is_active BOOLEAN DEFAULT TRUE 
      );
    `)

    // Create Students table (child table)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Students (
        user_id INTEGER PRIMARY KEY REFERENCES Users(id) ON DELETE CASCADE,
        student_matric_no VARCHAR(11) UNIQUE NOT NULL,
        department VARCHAR(100) NOT NULL
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
  }
}
