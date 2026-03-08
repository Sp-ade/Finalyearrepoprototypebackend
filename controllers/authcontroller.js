const authService = require('../services/authservice')
const jwt = require('../utils/jwt')
const db = require('../Database')
const emailService = require('../services/emailService')

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

exports.getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }
    const user = await authService.getUserByEmail(email)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query
    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }
    const decoded = jwt.verify(token)
    const result = await db.query(
      'SELECT * FROM Users WHERE email = $1 AND verification_token = $2',
      [decoded.email, token]
    )
    if (!result.rows[0]) {
      return res.status(400).json({ error: 'Invalid or expired token' })
    }
    await db.query(
      `UPDATE Users
       SET is_verified = true,
           verification_token = NULL,
           verification_expires = NULL
       WHERE email = $1`,
      [decoded.email]
    )

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
    next(err)
  }
}

// helper endpoint used by frontend test page
exports.forceVerify = async (req, res, next) => {
  try {
    const { email } = req.body || {}
    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Ensure verification columns exist in case older DB missing them
    await db.query(`
      ALTER TABLE Users
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
    `)
    await db.query(`
      ALTER TABLE Users
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
    `)
    await db.query(`
      ALTER TABLE Users
      ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP;
    `)

    const result = await db.query(
      `UPDATE Users SET is_verified = true WHERE email = $1 RETURNING *`,
      [email]
    )
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'User verified', user: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

exports.sendTestEmail = async (req, res, next) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'Email is required' })

    // send a lightweight test email (login notification template)
    await emailService.sendLoginNotification(email)

    res.json({ message: 'Test email sent' })
  } catch (err) {
    next(err)
  }
}

exports.updatePassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and newPassword are required' })
    }

    await authService.updatePassword(email, newPassword)
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
}
