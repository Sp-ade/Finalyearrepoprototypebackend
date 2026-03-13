const db = require('../Database')

module.exports = {
  findByEmail: async (email) => {
    return db.findUserByEmail(email)
  },
  create: async (email, passwordHash, firstName, lastName, role, roleSpecificId, department, verificationToken, verificationExpiry) => {
    return db.createUser(email, passwordHash, firstName, lastName, role, roleSpecificId, department, verificationToken, verificationExpiry)
  },
  getRoleSpecificData: async (userId, role) => {
    if (role === 'student') {
      const result = await db.query(
        'SELECT student_matric_no, department, role FROM Students WHERE user_id = $1',
        [userId]
      )
      if (result.rows[0]) {
        return {
          matricNo: result.rows[0].student_matric_no,
          department: result.rows[0].department
        }
      }
    } else if (role === 'supervisor') {
      const result = await db.query(
        'SELECT staff_id FROM Supervisors WHERE user_id = $1',
        [userId]
      )
      if (result.rows[0]) {
        return {
          staffId: result.rows[0].staff_id
        }
      }
    }
    return {} // Return empty object for admin or if no role-specific data found
  },
  findByVerificationToken: async (email, token) => {
    const result = await db.query(
      'SELECT * FROM Users WHERE email = $1 AND verification_token = $2',
      [email, token]
    )
    return result.rows[0] || null
  },
  markAsVerified: async (email) => {
    await db.query(
      `UPDATE Users
       SET is_verified = true,
           verification_token = NULL,
           verification_expires = NULL
       WHERE email = $1`,
      [email]
    )
  },
  forceVerifyByEmail: async (email) => {
    const result = await db.query(
      `UPDATE Users SET is_verified = true WHERE email = $1 RETURNING *`,
      [email]
    )
    return result.rows[0] || null
  },
  ensureVerificationColumns: async () => {
    await db.query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`)
    await db.query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);`)
    await db.query(`ALTER TABLE Users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;`)
  },
  updatePasswordHash: async (userId, passwordHash) => {
    const result = await db.query(
      'UPDATE Users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [passwordHash, userId]
    )
    return result.rows[0]
  }
}
