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
      const studentResult = await db.query(
        'SELECT student_matric_no, department FROM Students WHERE user_id = $1',
        [userId]
      )
      if (studentResult.rows[0]) {
        const data = {
          matricNo: studentResult.rows[0].student_matric_no,
          department: studentResult.rows[0].department
        }

        // Fetch group members if they exist
        const groupRes = await db.query(
          `SELECT group_number, year 
           FROM Project_Members 
           WHERE student_id = $1 
           ORDER BY year DESC LIMIT 1`,
          [userId]
        )

        if (groupRes.rows.length > 0) {
          const { group_number, year } = groupRes.rows[0];
          data.groupNumber = group_number;
          data.year = year;

          const membersRes = await db.query(
            `SELECT u.first_name, u.last_name, s.student_matric_no, s.role
             FROM Project_Members pm
             JOIN Users u ON pm.student_id = u.id
             JOIN Students s ON u.id = s.user_id
             WHERE pm.group_number = $1 AND pm.year = $2
             ORDER BY CASE WHEN s.role = 'leader' THEN 0 ELSE 1 END, u.first_name ASC`,
            [group_number, year]
          )
          data.groupMembers = membersRes.rows.map(m => ({
            name: `${m.first_name} ${m.last_name}`,
            matricNo: m.student_matric_no,
            role: m.role
          }))
        }
        return data
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
  },
  updateResetToken: async (email, token, expiry) => {
    await db.query(
      'UPDATE Users SET reset_token = $1, reset_expires = $2 WHERE email = $3',
      [token, expiry, email]
    )
  },
  findByResetToken: async (token) => {
    const result = await db.query(
      'SELECT * FROM Users WHERE reset_token = $1',
      [token]
    )
    return result.rows[0] || null
  },
  clearResetToken: async (userId) => {
    await db.query(
      'UPDATE Users SET reset_token = NULL, reset_expires = NULL WHERE id = $1',
      [userId]
    )
  },
  findById: async (id) => {
    const result = await db.query('SELECT * FROM Users WHERE id = $1', [id])
    return result.rows[0] || null
  },
  updateVerificationToken: async (email, token, expiry) => {
    await db.query(
      'UPDATE Users SET verification_token = $1, verification_expires = $2 WHERE email = $3',
      [token, expiry, email]
    )
  },
  updateUserDetails: async (userId, data) => {
    const { firstName, lastName, email, department, roleSpecificId, role } = data;
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Update base user info
      await client.query(
        `UPDATE Users 
         SET first_name = $1, last_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4`,
        [firstName, lastName, email, userId]
      );

      // Update role-specific info
      if (role === 'student') {
        await client.query(
          `UPDATE Students 
           SET student_matric_no = $1, department = $2 
           WHERE user_id = $3`,
          [roleSpecificId, department, userId]
        );
      } else if (role === 'supervisor') {
        await client.query(
          `UPDATE Supervisors 
           SET staff_id = $1 
           WHERE user_id = $2`,
          [roleSpecificId, userId]
        );
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

