const authService = require('../services/authservice')
const jwt = require('../utils/jwt')
const emailService = require('../services/emailService')

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    
    // Set cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 3600000 // 1 hour
    });

    res.json({
      success: true,
      user: result.user
    });
  } catch (err) {
    next(err)
  }
}

exports.logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.json({ success: true, message: 'Logged out successfully' });
}

exports.getUserByEmail = async (req, res, next) => {
  try {
    // IDOR Fix: Always use the email from the verified JWT, ignore client-supplied query param
    const email = req.user.email
    if (!email) {
      return res.status(401).json({ error: 'Authentication required' })
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
    await authService.verifyEmail(token, decoded.email)

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
    const user = await authService.forceVerify(email)
    res.json({ message: 'User verified', user })
  } catch (err) {
    next(err)
  }
}

exports.sendTestEmail = async (req, res, next) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: 'Email is required' })
    await emailService.sendLoginNotification(email)
    res.json({ message: 'Test email sent' })
  } catch (err) {
    next(err)
  }
}

exports.updatePassword = async (req, res, next) => {
  try {
    // IDOR Fix: Use email from JWT instead of req.body
    const email = req.user.email
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' })
    }
    await authService.updatePassword(email, currentPassword, newPassword)
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
}
