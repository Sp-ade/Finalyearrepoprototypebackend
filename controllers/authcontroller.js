const authService = require('../services/authservice')
const jwt = require('../utils/jwt')
const emailService = require('../services/emailService')
const templates = require('../utils/templates')

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)

    /* 
    // Set secure HttpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true, // Required for SameSite: 'None' on Render
      sameSite: 'none', // Required for cross-domain cookies
      maxAge: 1 * 60 * 60 * 1000 // 1 hour
    });
    */

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
  /*
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  */
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
  const token = req.query.token || req.body.token;
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

  if (!token) {
    return res.status(400).send('Verification token is missing.');
  }

  // Handle GET request: Show confirmation page
  if (req.method === 'GET') {
    return res.send(templates.confirmVerificationPage(token, BACKEND_URL));
  }

  // Handle POST request: Perform actual verification
  try {
    const decoded = jwt.verify(token);
    await authService.verifyEmail(token, decoded.email);

    // SUCCESS: Serve the verification success page from template
    return res.send(templates.verificationSuccess);
  } catch (err) {
    // FAILURE: Show the error page from template
    return res.status(400).send(templates.verificationFailed);
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

  // Render the beautiful reset password form from template
  return res.send(templates.resetPasswordForm(token, BACKEND_URL));
}

exports.handleResetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).send('Missing token or password');
  }

  try {
    await authService.resetPassword(token, password);

    // SUCCESS: Serve the password reset success page from template
    return res.send(templates.resetPasswordSuccess);
  } catch (err) {
    // FAILURE: Show the error page from template
    return res.status(400).send(templates.resetPasswordFailed(err.message));
  }
}

exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const result = await authService.resendVerification(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
