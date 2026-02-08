const db = require('../Database')

module.exports = {
  findByEmail: async (email) => {
    return db.findUserByEmail(email)
  },
  create: async (email, passwordHash) => {
    return db.createUser(email, passwordHash)
  },
  getRoleSpecificData: async (userId, role) => {
    if (role === 'student') {
      const result = await db.query(
        'SELECT student_matric_no, department FROM Students WHERE user_id = $1',
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
  }
}
