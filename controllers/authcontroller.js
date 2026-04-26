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

    // SUCCESS: Serve a beautiful verification success page
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verified | Nile University Repository</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
              :root {
                  --primary: #2b4593;
                  --primary-hover: #213a76;
                  --bg: #f8fafc;
                  --card-bg: #ffffff;
                  --text-main: #1e293b;
                  --text-muted: #64748b;
              }
              body {
                  margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
                  min-height: 100vh; font-family: 'Outfit', sans-serif;
                  background: radial-gradient(circle at top right, #f0fdf4, transparent),
                              radial-gradient(circle at bottom left, #f0fdf4, transparent),
                              var(--bg);
                  color: var(--text-main);
              }
              .card {
                  background: var(--card-bg); padding: 3rem 2rem; border-radius: 24px;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                  text-align: center; max-width: 440px; width: 90%;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
              }
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              .checkmark-wrapper {
                  width: 80px; height: 80px; background: #dce6fcff; border-radius: 50%;
                  display: flex; justify-content: center; align-items: center; margin: 0 auto 2rem;
              }
              .checkmark { width: 40px; height: 40px; color: var(--primary); animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
              @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              h1 { font-size: 28px; font-weight: 700; margin: 0 0 1rem; letter-spacing: -0.025em; }
              p { color: var(--text-muted); line-height: 1.6; margin-bottom: 2.5rem; font-size: 16px; }
              .btn {
                  display: block; background: var(--primary); color: white; padding: 14px 32px;
                  text-decoration: none; border-radius: 12px; font-weight: 600;
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2);
              }
              .btn:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.2); }
              .footer { margin-top: 2rem; font-size: 14px; color: var(--text-muted); }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="checkmark-wrapper">
                  <svg class="checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
              </div>
              <h1>Account Verified!</h1>
              <p>Your email has been successfully verified. You can now access all features of the Nile University Repository.</p>
              <a href="${FRONTEND_URL}/login" class="btn">Continue to Login</a>
              <div class="footer">Nile University Repository</div>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    // FAILURE: Show a beautiful error page consistent with the success page
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed | Nile University Repository</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
              :root {
                  --primary: #ef4444;
                  --primary-hover: #dc2626;
                  --bg: #f8fafc;
                  --card-bg: #ffffff;
                  --text-main: #1e293b;
                  --text-muted: #64748b;
              }
              body {
                  margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
                  min-height: 100vh; font-family: 'Outfit', sans-serif;
                  background: radial-gradient(circle at top right, #fef2f2, transparent),
                              radial-gradient(circle at bottom left, #fef2f2, transparent),
                              var(--bg);
                  color: var(--text-main);
              }
              .card {
                  background: var(--card-bg); padding: 3rem 2rem; border-radius: 24px;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                  text-align: center; max-width: 440px; width: 90%;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
              }
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              .icon-wrapper {
                  width: 80px; height: 80px; background: #fee2e2; border-radius: 50%;
                  display: flex; justify-content: center; align-items: center; margin: 0 auto 2rem;
              }
              .icon { width: 40px; height: 40px; color: var(--primary); animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
              @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              h1 { font-size: 28px; font-weight: 700; margin: 0 0 1rem; letter-spacing: -0.025em; }
              p { color: var(--text-muted); line-height: 1.6; margin-bottom: 2.5rem; font-size: 16px; }
              .btn {
                  display: block; background: #f1f5f9; color: #475569; padding: 14px 32px;
                  text-decoration: none; border-radius: 12px; font-weight: 600;
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                  border: 1px solid #e2e8f0;
              }
              .btn:hover { background: #e2e8f0; transform: translateY(-2px); }
              .footer { margin-top: 2rem; font-size: 14px; color: var(--text-muted); }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="icon-wrapper">
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
              </div>
              <h1>Link Expired</h1>
              <p>This verification link is invalid or has already been used. Please try to log in to request a new link.</p>
              <a href="${FRONTEND_URL}/login" class="btn">Go to Login</a>
              <div class="footer">Nile University Repository</div>
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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }
    
    // Call service. It handles generating token and sending email.
    // It returns quickly to prevent timing attacks.
    await authService.forgotPassword(email)
    res.json({ message: 'Recovery instructions have been sent to your email.' })
  } catch (err) {
    next(err)
  }
}

exports.renderResetPasswordPage = async (req, res) => {
  const { token } = req.query;
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

  if (!token) {
    return res.status(400).send('Reset token is missing.');
  }

  // Render the beautiful reset password form
  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password | Nile University Repository</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
            :root {
                --primary: #2b4593;
                --primary-hover: #213a76;
                --bg: #f8fafc;
                --card-bg: #ffffff;
                --text-main: #1e293b;
                --text-muted: #64748b;
                --border: #e2e8f0;
            }
            body {
                margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
                min-height: 100vh; font-family: 'Outfit', sans-serif;
                background: radial-gradient(circle at top right, #e0e7ff, transparent),
                            radial-gradient(circle at bottom left, #e0e7ff, transparent),
                            var(--bg);
                color: var(--text-main);
            }
            .card {
                background: var(--card-bg); padding: 3rem 2.5rem; border-radius: 24px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                text-align: left; max-width: 440px; width: 90%;
                border: 1px solid rgba(255, 255, 255, 0.1);
                animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            h1 { font-size: 26px; font-weight: 700; margin: 0 0 0.5rem; letter-spacing: -0.025em; text-align: center; color: var(--primary); }
            p { color: var(--text-muted); line-height: 1.5; margin-bottom: 2rem; font-size: 15px; text-align: center; }
            .form-group { margin-bottom: 1.5rem; }
            label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main); }
            input {
                width: 100%; padding: 12px 16px; font-size: 15px; border: 1.5px solid var(--border);
                border-radius: 12px; outline: none; transition: border-color 0.2s; box-sizing: border-box;
                font-family: 'Outfit', sans-serif;
            }
            input:focus { border-color: var(--primary); }
            .btn {
                display: block; width: 100%; background: var(--primary); color: white; padding: 14px;
                text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                border: none; cursor: pointer; font-family: 'Outfit', sans-serif;
            }
            .btn:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(43, 69, 147, 0.2); }
            .footer { margin-top: 2rem; font-size: 14px; color: var(--text-muted); text-align: center; }
            .error-message { color: #ef4444; font-size: 14px; margin-top: 5px; display: none; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Create New Password</h1>
            <p>Your new password must be at least 6 characters long.</p>
            <form action="${BACKEND_URL}/api/reset-password" method="POST" onsubmit="return validateForm()">
                <input type="hidden" name="token" value="${token}">
                <div class="form-group">
                    <label for="password">New Password</label>
                    <input type="password" id="password" name="password" required minlength="6" placeholder="Enter new password">
                </div>
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" placeholder="Confirm new password">
                    <div id="errorMsg" class="error-message">Passwords do not match</div>
                </div>
                <button type="submit" class="btn">Reset Password</button>
            </form>
            <div class="footer">Nile University Repository</div>
        </div>
        <script>
            function validateForm() {
                var password = document.getElementById("password").value;
                var confirmPassword = document.getElementById("confirmPassword").value;
                if (password !== confirmPassword) {
                    document.getElementById("errorMsg").style.display = "block";
                    return false;
                }
                return true;
            }
        </script>
    </body>
    </html>
  `);
}

exports.handleResetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!token || !password) {
    return res.status(400).send('Missing token or password');
  }

  try {
    await authService.resetPassword(token, password);
    
    // SUCCESS: Serve a beautiful password reset success page
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset Successful | Nile University Repository</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
              :root {
                  --primary: #2b4593;
                  --primary-hover: #213a76;
                  --bg: #f8fafc;
                  --card-bg: #ffffff;
                  --text-main: #1e293b;
                  --text-muted: #64748b;
              }
              body {
                  margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
                  min-height: 100vh; font-family: 'Outfit', sans-serif;
                  background: radial-gradient(circle at top right, #e0e7ff, transparent),
                              radial-gradient(circle at bottom left, #e0e7ff, transparent),
                              var(--bg);
                  color: var(--text-main);
              }
              .card {
                  background: var(--card-bg); padding: 3rem 2rem; border-radius: 24px;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                  text-align: center; max-width: 440px; width: 90%;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
              }
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              .checkmark-wrapper {
                  width: 80px; height: 80px; background: #e0e7ff; border-radius: 50%;
                  display: flex; justify-content: center; align-items: center; margin: 0 auto 2rem;
              }
              .checkmark { width: 40px; height: 40px; color: var(--primary); animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
              @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              h1 { font-size: 26px; font-weight: 700; margin: 0 0 1rem; letter-spacing: -0.025em; }
              p { color: var(--text-muted); line-height: 1.6; margin-bottom: 2.5rem; font-size: 16px; }
              .btn {
                  display: block; background: var(--primary); color: white; padding: 14px 32px;
                  text-decoration: none; border-radius: 12px; font-weight: 600;
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .btn:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(43, 69, 147, 0.2); }
              .footer { margin-top: 2rem; font-size: 14px; color: var(--text-muted); }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="checkmark-wrapper">
                  <svg class="checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                  </svg>
              </div>
              <h1>Password Updated!</h1>
              <p>Your password has been successfully reset. You can now log in with your new password.</p>
              <a href="${FRONTEND_URL}/login" class="btn">Return to Login</a>
              <div class="footer">Nile University Repository</div>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    // FAILURE: Show a beautiful error page
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Failed | Nile University Repository</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
              :root {
                  --primary: #ef4444;
                  --primary-hover: #dc2626;
                  --bg: #f8fafc;
                  --card-bg: #ffffff;
                  --text-main: #1e293b;
                  --text-muted: #64748b;
              }
              body {
                  margin: 0; padding: 0; display: flex; justify-content: center; align-items: center;
                  min-height: 100vh; font-family: 'Outfit', sans-serif;
                  background: radial-gradient(circle at top right, #fef2f2, transparent),
                              radial-gradient(circle at bottom left, #fef2f2, transparent),
                              var(--bg);
                  color: var(--text-main);
              }
              .card {
                  background: var(--card-bg); padding: 3rem 2rem; border-radius: 24px;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                  text-align: center; max-width: 440px; width: 90%;
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
              }
              @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              .icon-wrapper {
                  width: 80px; height: 80px; background: #fee2e2; border-radius: 50%;
                  display: flex; justify-content: center; align-items: center; margin: 0 auto 2rem;
              }
              .icon { width: 40px; height: 40px; color: var(--primary); animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
              @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
              h1 { font-size: 26px; font-weight: 700; margin: 0 0 1rem; letter-spacing: -0.025em; }
              p { color: var(--text-muted); line-height: 1.6; margin-bottom: 2.5rem; font-size: 16px; }
              .btn {
                  display: block; background: #f1f5f9; color: #475569; padding: 14px 32px;
                  text-decoration: none; border-radius: 12px; font-weight: 600;
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                  border: 1px solid #e2e8f0;
              }
              .btn:hover { background: #e2e8f0; transform: translateY(-2px); }
              .footer { margin-top: 2rem; font-size: 14px; color: var(--text-muted); }
          </style>
      </head>
      <body>
          <div class="card">
              <div class="icon-wrapper">
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
              </div>
              <h1>Reset Failed</h1>
              <p>${err.message || 'The password reset link is invalid or has expired. Please request a new one.'}</p>
              <a href="${FRONTEND_URL}/forgot-password" class="btn">Try Again</a>
              <div class="footer">Nile University Repository</div>
          </div>
      </body>
      </html>
    `);
  }
}
