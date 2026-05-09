const https = require('https');
require('dotenv').config();

const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Sender identity — must be a verified sender in your Brevo account
const SENDER = {
  name: 'Nile University Repository',
  email: process.env.EMAIL_USER,
};

if (!BREVO_API_KEY) {
  console.warn('⚠️  BREVO_API_KEY is missing. Email sending will fail. Set it in Render environment variables.');
} else {
  console.log('✅ Email service (Brevo) configured.');
}

/**
 * Core helper: POST to Brevo's Transactional Email REST API
 * Uses Node's built-in https — no external SDK needed.
 */
const sendEmail = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sender: SENDER,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

/**
 * Send account verification email
 */
const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.BACKEND_URL}/api/verify-email?token=${token}`;
  console.log(`📧 Sending verification email to: ${email}`);

  try {
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Nile University Repository',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #28a745; text-align: center;">Account Verification</h2>
          <p>Thank you for joining the Nile University Repository. Please click the button below to verify your account:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${verificationLink}"
               style="background-color: #28a745; color: white; padding: 14px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">This link will expire in 1 hour. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`✅ Verification email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send verification email:', err.message);
  }
};

/**
 * Send login security notification
 */
const sendLoginNotification = async (email) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Login Alert - Nile Repository',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #2b4593;">Security Alert</h2>
          <p>Your account was just logged in to the Nile University Repository.</p>
          <p>If this was not you, please reset your password immediately to secure your account.</p>
        </div>
      `,
    });
    console.log(`✅ Login notification sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send login notification:', err.message);
  }
};

/**
 * Send group formation notification email
 */
const sendGroupFormationEmail = async (email, { supervisorName, groupNumber, year, role }) => {
  console.log(`📧 Sending group formation email to: ${email}`);

  try {
    await sendEmail({
      to: email,
      subject: `Group Assignment - Nile Repository (${year})`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #2b4593; text-align: center;">Group Assignment Notification</h2>
          <p>Hello,</p>
          <p>You have been assigned to a project group for the academic year <strong>${year}</strong> by <strong>${supervisorName}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0;"><strong>Group Details:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Group Number:</strong> ${groupNumber}</li>
              <li><strong>Your Role:</strong> ${role}</li>
              <li><strong>Academic Year:</strong> ${year}</li>
            </ul>
          </div>
          
          <p>You can now collaborate with your group members and start working on your project submissions.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
               style="background-color: #2b4593; color: white; padding: 14px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Dashboard
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
            This is an automated notification from the Nile University Repository.
          </p>
        </div>
      `,
    });
    console.log(`✅ Group formation email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send group formation email:', err.message);
  }
};

/**
 * Send password reset email
 */
const sendResetPasswordEmail = async (email, token) => {
  const resetLink = `${process.env.BACKEND_URL}/api/reset-password?token=${token}`;
  console.log(`📧 Sending reset password email to: ${email}`);

  try {
    await sendEmail({
      to: email,
      subject: 'Reset Your Password - Nile University Repository',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #2b4593; text-align: center;">Reset Your Password</h2>
          <p>We received a request to reset your password for the Nile University Repository. Click the button below to choose a new password:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetLink}"
               style="background-color: #2b4593; color: white; padding: 14px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`✅ Reset password email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send reset password email:', err.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendLoginNotification,
  sendResetPasswordEmail,
  sendGroupFormationEmail,
};
