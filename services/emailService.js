const nodemailer = require("nodemailer");

// Get configurations from environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_FROM = process.env.EMAIL_FROM || `"Nile University Repository" <${EMAIL_USER}>`;

let transporter = null;

if (process.env.MAILTRAP_TOKEN) {
  try {
    const { MailtrapTransport } = require('mailtrap');
    transporter = nodemailer.createTransport(
      MailtrapTransport({ token: process.env.MAILTRAP_TOKEN })
    );
    console.log('📦 Using Mailtrap transport for email');
  } catch (err) {
    console.error('Failed to set up Mailtrap transport, falling back to SMTP:', err);
  }
}

if (!transporter && process.env.EMAIL_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // upgrade with STARTTLS if available
    auth: {
      user: EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Office 365 requires this sometimes
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email SMTP Error:', error.message);
    } else {
      console.log('✅ Email transporter is ready');
    }
  });
} else if (!transporter) {
  console.warn('⚠️  No email transport configured; email functions will be no‑ops');
}

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${BACKEND_URL}/api/verify-email?token=${token}`;

  if (!transporter) {
    console.log('📧 skipping verification email (transporter not configured)');
    return;
  }

  try {
    console.log(`📧 Sending verification email to: ${email}`);
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #28a745;">Email Verification</h2>
          <p>Hello,</p>
          <p>Thank you for registering. Please click the button below to verify your account:</p>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${verificationLink}" 
               style="
                 background-color: #28a745;
                 color: white;
                 padding: 14px 25px;
                 text-decoration: none;
                 border-radius: 5px;
                 display: inline-block;
                 font-weight: bold;
                 font-size: 16px;
               ">
              Verify Email
            </a>
          </div>

          <p>If you're having trouble clicking the "Verify Email" button,
          copy and paste the URL below into your web browser:</p>

          <p style="word-break: break-all; color: #007bff; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <a href="${verificationLink}">${verificationLink}</a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            This link expires in 1 hour. If you did not create an account, please ignore this email.
          </p>
        </div>
      `,
    });
    console.log(`✅ Verification email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send verification email:', err.message);
  }
};

const sendLoginNotification = async (email) => {
  if (!transporter) {
    console.log(`📧 login notification skipped for ${email}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Login Alert",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Login Notification</h2>
          <p>Your account was just logged in.</p>
          <p>If this wasn't you, please reset your password immediately.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('❌ Failed to send login notification:', err.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendLoginNotification,
};
