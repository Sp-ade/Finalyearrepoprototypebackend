const userRepo = require('../repositories/userRepository')
const bcrypt = require('bcrypt')
const jwt = require('../utils/jwt')
const { sendLoginNotification } = require('../services/emailService')
const db = require('../Database')

exports.login = async (email, password) => {
  const user = await userRepo.findByEmail(email)

  if (!user) throw new Error('Invalid credentials')

  if (!user.is_verified) {
    throw new Error('Please verify your email before logging in')
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) throw new Error('Invalid credentials')

  const token = jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role
  })

  // Send login notification (the error is not fatal this way)
  //
  // try {
  //   await sendLoginNotification(user.email)
  // } catch (err) {
  //   console.error('Login notification failed', err)
  // }
  sendLoginNotification(user.email).catch(err => {
    console.error('Login notification failed', err)
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    },
    token
  }
}

exports.getUserByEmail = async (email) => {
  const user = await userRepo.findByEmail(email)

  if (!user) {
    throw new Error('User not found')
  }

  // Fetch role-specific data
  const roleData = await userRepo.getRoleSpecificData(user.id, user.role)

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    createdAt: user.created_at,
    isActive: user.is_active,
    ...roleData // Spread role-specific fields (matricNo, department, or staffId)
  }
}

exports.updatePassword = async (email, newPassword) => {
  const user = await userRepo.findByEmail(email)
  if (!user) {
    throw new Error('User not found')
  }

  // Check if new password is same as current
  const isSame = await bcrypt.compare(newPassword, user.password_hash)
  if (isSame) {
    throw new Error('New password cannot be the same as current password')
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(newPassword, saltRounds)

  const result = await db.query(
    'UPDATE Users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
    [passwordHash, user.id]
  )

  return result.rows[0]
}