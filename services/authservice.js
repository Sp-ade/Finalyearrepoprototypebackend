const userRepo = require('../repositories/userRepository')
const bcrypt = require('bcrypt')
const jwt = require('../utils/jwt') // small wrapper around jsonwebtoken

exports.login = async (email, password) => {
  const user = await userRepo.findByEmail(email)
  if (!user) throw new Error('Invalid credentials') // replace with typed error
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) throw new Error('Invalid credentials')
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role })
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
  if (!user) throw new Error('User not found')

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