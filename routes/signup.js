const express = require('express')
const router = express.Router()
const db = require('../Database')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { sendVerificationEmail } = require('../services/emailService')

router.post('/signup', async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role, studentId, department } = req.body

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !role || !studentId) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        // Validate department for students
        if (role === 'student' && !department) {
            return res.status(400).json({ message: 'Department is required for students' })
        }

        // Validate email domain
        if (!email.endsWith('@nileuniversity.edu.ng')) {
            return res.status(400).json({ message: 'Email must be from @nileuniversity.edu.ng domain' })
        }

        // Validate email format for students (must be digits@nileuniversity.edu.ng)
        if (role === 'student') {
            const emailPrefix = email.split('@')[0]
            if (!/^\d+$/.test(emailPrefix)) {
                return res.status(400).json({
                    message: 'Student email must be digits@nileuniversity.edu.ng (e.g., 123456@nileuniversity.edu.ng)'
                })
            }
        }

        // Validate role
        if (!['student', 'supervisor'].includes(role)) {
            return res.status(400).json({ message: 'Role must be either student or supervisor' })
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' })
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // 🔐 Generate verification token (expires in 1 hour)
        const verificationToken = jwt.sign(
            { email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )

        const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000)

        // Create user with verification fields
        const user = await db.createUser(
            email,
            passwordHash,
            firstName,
            lastName,
            role,
            studentId,
            department,
            verificationToken,
            verificationExpiry
        )

        if (!user) {
            return res.status(409).json({
                message: 'User with this email or ID already exists'
            })
        }

        // Send verification email
        await sendVerificationEmail(email, verificationToken)

        res.status(201).json({
            message: 'Account created successfully. Please verify your email.',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        })

    } catch (err) {
      // Handle unique constraint violations
        if (err.code === '23505') {
            return res.status(409).json({
                message: 'User with this email or ID already exists'
            })
        }
        next(err)
    }
})

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Invalid verification link");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      'SELECT * FROM Users WHERE email = $1 AND verification_token = $2',
      [decoded.email, token]
    );

    if (!result.rows[0]) {
      return res.status(400).send("Invalid or expired token");
    }

    await db.query(
      `UPDATE Users 
       SET is_verified = true,
           verification_token = NULL,
           verification_expires = NULL
       WHERE email = $1`,
      [decoded.email]
    );

    // ✅ Direct success page
    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
        </head>
        <body style="
          display:flex;
          justify-content:center;
          align-items:center;
          height:100vh;
          font-family:Arial;
          background:#f4f4f4;
          text-align:center;
        ">
          <div>
            <h1 style="color:#28a745;">Email Verified Successfully</h1>
            <div style="font-size:80px;color:#28a745;">✔</div>
            <p>You can now log in to your account.</p>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    res.status(400).send("Invalid or expired token");
  }
});

module.exports = router