const nodemailer = require("nodemailer");
const dns = require('dns');

// Force IPv4 globally for this module to fix Render ENETUNREACH errors
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Get configurations from environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_FROM = process.env.EMAIL_FROM || `"Nile University Repository" <${EMAIL_USER}>`;

// Configure transporter with Gmail-friendly defaults
let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: (process.env.EMAIL_PORT == 465), // Only true for 465
  auth: {
    user: EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // CRITICAL: Force IPv4 for this specific connection
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  // STARTTLS settings for 587
  requireTLS: true,
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration on startup
if (EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email SMTP Error:', error.message);
    } else {
      console.log('✅ Email service online');
    }
  });
} else {
  console.warn('⚠️  Email credentials missing. Please set EMAIL_USER and EMAIL_PASS on Render.');
}

const sendVerificationEmail = async (email, token) => {
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
  const verificationLink = `${BACKEND_URL}/api/verify-email?token=${token}`;

  console.log(`📧 Sending verification email to: ${email}`);
  console.log(`🔗 Verification link: ${verificationLink}`);

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify Your Email - Nile University Repository",
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

const sendLoginNotification = async (email) => {
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Login Alert - Nile Repository",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Security Alert</h2>
          <p>Your account was just logged in.</p>
          <p>If this was not you, please reset your password immediately to secure your account.</p>
        </div>
      `,
    });
    console.log(`✅ Login notification sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send login notification:', err.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendLoginNotification,
};
