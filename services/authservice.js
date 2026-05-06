const userRepo = require('../repositories/userRepository')
const bcrypt = require('bcrypt')
const jwt = require('../utils/jwt')
const { sendLoginNotification } = require('../services/emailService')
const { validatePassword } = require('../utils/passwordValidator')

exports.login = async (email, password) => {
  const user = await userRepo.findByEmail(email)

  if (!user) throw new Error('Invalid credentials')

  console.log(`[AUTH DEBUG] User ${email} is_verified:`, user.is_verified, `(Type: ${typeof user.is_verified})`);

  if (user.is_verified !== true) {
    const error = new Error('Please verify your email before logging in')
    error.statusCode = 403
    throw error
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) throw new Error('Invalid credentials')

  const token = jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role
  })

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

  const roleData = await userRepo.getRoleSpecificData(user.id, user.role)

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    createdAt: user.created_at,
    isActive: user.is_active,
    ...roleData
  }
}

exports.verifyEmail = async (token, decodedEmail) => {
  const user = await userRepo.findByEmail(decodedEmail)

  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }

  // If already verified, don't throw an error, just return (Success)
  if (user.is_verified) {
    return
  }

  // If not verified, check if tokens match
  if (user.verification_token !== token) {
    const error = new Error('Invalid or expired token')
    error.statusCode = 400
    throw error
  }

  await userRepo.markAsVerified(decodedEmail)
}

exports.forceVerify = async (email) => {
  await userRepo.ensureVerificationColumns()
  const user = await userRepo.forceVerifyByEmail(email)
  if (!user) {
    const error = new Error('User not found')
    error.statusCode = 404
    throw error
  }
  return user
}

exports.updatePassword = async (email, currentPassword, newPassword) => {
  const user = await userRepo.findByEmail(email)
  if (!user) {
    throw new Error('User not found')
  }

  const isCorrect = await bcrypt.compare(currentPassword, user.password_hash)
  if (!isCorrect) {
    throw new Error('Incorrect current password')
  }

  // Validate new password strength
  const passwordErrors = validatePassword(newPassword)
  if (passwordErrors.length > 0) {
    const error = new Error(passwordErrors.join('. '))
    error.statusCode = 400
    throw error
  }

  const isSame = await bcrypt.compare(newPassword, user.password_hash)
  if (isSame) {
    throw new Error('New password cannot be the same as current password')
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(newPassword, saltRounds)
  return await userRepo.updatePasswordHash(user.id, passwordHash)
}
exports.forgotPassword = async (email) => {
  const user = await userRepo.findByEmail(email)
  if (!user) {
    const error = new Error('No account found with that email address')
    error.statusCode = 404
    throw error
  }

  // Generate reset token (1 hour expiry)
  const resetToken = jwt.sign({ email: user.email, type: 'reset' }, { expiresIn: '1h' })
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000)

  await userRepo.updateResetToken(user.email, resetToken, resetExpiry)

  const { sendResetPasswordEmail } = require('../services/emailService')
  sendResetPasswordEmail(user.email, resetToken).catch(err => {
    console.error('❌ Background Reset Password Email Error:', err.message);
  })
}

exports.resetPassword = async (token, newPassword) => {
  // Validate password strength
  const passwordErrors = validatePassword(newPassword)
  if (passwordErrors.length > 0) {
    const error = new Error(passwordErrors.join('. '))
    error.statusCode = 400
    throw error
  }

  try {
    const decoded = jwt.verify(token)
    if (decoded.type !== 'reset') {
      const error = new Error('Invalid token type')
      error.statusCode = 400
      throw error
    }

    const user = await userRepo.findByResetToken(token)

    if (!user) {
      const error = new Error('Invalid or expired reset token')
      error.statusCode = 400
      throw error
    }

    // Check expiry manually just in case
    if (new Date() > new Date(user.reset_expires)) {
      const error = new Error('Reset token has expired')
      error.statusCode = 400
      throw error
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)

    await userRepo.updatePasswordHash(user.id, passwordHash)
    await userRepo.clearResetToken(user.id)

  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      const error = new Error('Invalid or expired reset token')
      error.statusCode = 400
      throw error
    }
    throw err
  }
}

exports.signup = async ({ email, password, firstName, lastName, role, studentId, department }) => {
  // Validate required fields
  if (!email || !password || !firstName || !lastName || !role || !studentId) {
    const error = new Error('All fields are required')
    error.statusCode = 400
    throw error
  }

  // Validate department for students
  if (role === 'student' && !department) {
    const error = new Error('Department is required for students')
    error.statusCode = 400
    throw error
  }

  // Validate email domain
  if (!email.endsWith('@nileuniversity.edu.ng')) {
    const error = new Error('Email must be from @nileuniversity.edu.ng domain')
    error.statusCode = 400
    throw error
  }

  // Validate student email format (digits only before @)
  if (role === 'student') {
    const emailPrefix = email.split('@')[0]
    if (!/^\d+$/.test(emailPrefix)) {
      const error = new Error('Student email must be digits@nileuniversity.edu.ng (e.g., 123456@nileuniversity.edu.ng)')
      error.statusCode = 400
      throw error
    }
  }

  // Validate role
  if (!['student', 'supervisor'].includes(role)) {
    const error = new Error('Role must be either student or supervisor')
    error.statusCode = 400
    throw error
  }

  // Validate password strength
  const passwordErrors = validatePassword(password)
  if (passwordErrors.length > 0) {
    const error = new Error(passwordErrors.join('. '))
    error.statusCode = 400
    throw error
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Generate verification token (1 hour expiry)
  const verificationToken = jwt.sign({ email }, { expiresIn: '1h' })
  const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000)

  // Create user record
  const { sendVerificationEmail } = require('../services/emailService')
  const user = await userRepo.create(email, passwordHash, firstName, lastName, role, studentId, department, verificationToken, verificationExpiry)

  if (!user) {
    const error = new Error('User with this email or ID already exists')
    error.statusCode = 409
    throw error
  }

  // Send verification email in background (don't await)
  sendVerificationEmail(email, verificationToken).catch(err => {
    console.error('❌ Background Verification Email Error:', err.message);
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role
  }
}

exports.resendVerification = async (email) => {
  const user = await userRepo.findByEmail(email)
  
  if (!user) {
    const error = new Error('No account found with that email address')
    error.statusCode = 404
    throw error
  }

  if (user.is_verified) {
    const error = new Error('This account is already verified')
    error.statusCode = 400
    throw error
  }

  // Generate new token (1 hour expiry)
  const verificationToken = jwt.sign({ email }, { expiresIn: '1h' })
  const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000)

  // Update in database
  await userRepo.updateVerificationToken(email, verificationToken, verificationExpiry)

  // Send email
  const { sendVerificationEmail } = require('../services/emailService')
  await sendVerificationEmail(email, verificationToken)

  return { message: 'Verification email resent successfully' }
}

/**
 * Verify a user's password without logging them in
 */
exports.verifyPassword = async (email, password) => {
  const user = await userRepo.findByEmail(email)
  if (!user) {
    throw new Error('User not found')
  }

  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    throw new Error('Invalid password')
  }
  
  return true
}

