const authService = require('../services/authservice')
const jwt = require('../utils/jwt')
const emailService = require('../services/emailService')

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    

    res.json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (err) {
    next(err)
  }
}

exports.logout = async (req, res) => {
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
  const { token } = req.query;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!token) {
    return res.status(400).send('Verification token is missing.');
  }

  try {
    const decoded = jwt.verify(token);
    await authService.verifyEmail(token, decoded.email);
    
    // SUCCESS: Redirect to frontend login with a success flag
    return res.redirect(`${FRONTEND_URL}/login?verified=true`);
  } catch (err) {
    // FAILURE: Show a beautiful error page instead of raw JSON
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed | Nile University Repository</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
              body {
                  margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
                  min-height: 100vh; font-family: 'Inter', sans-serif;
                  background: #fff; color: #212529;
              }
              .container { text-align: center; max-width: 400px; padding: 2rem; }
              .icon { font-size: 60px; color: #dc3545; margin-bottom: 1rem; }
              h1 { font-size: 22px; margin-bottom: 1rem; font-weight: 700; }
              p { color: #6c757d; line-height: 1.6; margin-bottom: 2rem; }
              .btn {
                  display: inline-block; background: #f8f9fa; color: #212529;
                  padding: 10px 24px; text-decoration: none; border-radius: 8px;
                  font-weight: 600; border: 1px solid #dee2e6; transition: all 0.2s;
              }
              .btn:hover { background: #e9ecef; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="icon">⚠️</div>
              <h1>Verification Link Expired</h1>
              <p>This verification link is invalid or has already been used. Please try to log in to request a new link.</p>
              <a href="${FRONTEND_URL}/login" class="btn">Go to Login</a>
          </div>
      </body>
      </html>
    `);
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
