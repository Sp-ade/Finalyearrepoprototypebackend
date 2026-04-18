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
  try {
    const { token } = req.query
    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }
    const decoded = jwt.verify(token)
    await authService.verifyEmail(token, decoded.email)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verified | Nile University Repository</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
              
              body {
                  margin: 0;
                  padding: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  font-family: 'Inter', system-ui, -apple-system, sans-serif;
                  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                  color: #212529;
              }

              .container {
                  background: white;
                  padding: 3rem;
                  border-radius: 20px;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                  text-align: center;
                  max-width: 450px;
                  width: 90%;
                  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
              }

              @keyframes slideUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
              }

              .icon-circle {
                  width: 80px;
                  height: 80px;
                  background: #eefdf3;
                  border-radius: 50%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  margin: 0 auto 2rem;
              }

              .checkmark {
                  color: #28a745;
                  font-size: 40px;
                  font-weight: bold;
              }

              h1 {
                  font-size: 24px;
                  margin-bottom: 1rem;
                  color: #1a1a1a;
                  font-weight: 700;
              }

              p {
                  color: #6c757d;
                  line-height: 1.6;
                  margin-bottom: 2.5rem;
                  font-size: 16px;
              }

              .btn {
                  display: inline-block;
                  background: #1a1a1a;
                  color: white;
                  padding: 12px 32px;
                  text-decoration: none;
                  border-radius: 10px;
                  font-weight: 600;
                  transition: all 0.3s ease;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              }

              .btn:hover {
                  background: #333;
                  transform: translateY(-2px);
                  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
              }

              .brand {
                  margin-top: 2rem;
                  font-size: 12px;
                  color: #adb5bd;
                  letter-spacing: 1px;
                  text-transform: uppercase;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="icon-circle">
                  <span class="checkmark">✓</span>
              </div>
              <h1>Account Verified!</h1>
              <p>Your email has been successfully verified. You can now access your account and start managing your projects.</p>
              <a href="${FRONTEND_URL}/login" class="btn">Continue to Login</a>
              <div class="brand">Nile University Repository</div>
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
