const nodemailer = require("nodemailer");

// if a Mailtrap API token is supplied, prefer that transport (good for dev/testing)
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

// otherwise configure using standard SMTP host/user/pass
if (!transporter && process.env.EMAIL_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // upgrade with STARTTLS if available
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
} else if (!transporter) {
  console.warn('⚠️  No email transport configured; email functions will be no‑ops');
}

const sendVerificationEmail = async (email, token) => {
  const verificationLink =
    `http://localhost:3000/api/verify-email?token=${token}`;

  if (!transporter) {
    console.log('📧 skipping verification email (transporter not configured)');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Nile University Repository" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Hello,</p>
          <p>Please click the button below to verify your account:</p>

          <div style="margin: 20px 0;">
            <a href="${verificationLink}" 
               style="
                 background-color: #28a745;
                 color: white;
                 padding: 12px 20px;
                 text-decoration: none;
                 border-radius: 5px;
                 display: inline-block;
                 font-weight: bold;
               ">
              Verify Email
            </a>
          </div>

          <p>If you're having trouble clicking the \"Verify Email\" button,
          copy and paste the URL below into your web browser:</p>

          <p style="word-break: break-all; color: blue;">
            ${verificationLink}
          </p>

          <p>This link expires in 1 hour.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('❌ Failed to send verification email:', err);
  }
};

const sendLoginNotification = async (email) => {
  if (!transporter) {
    // non-critical, just log locally
    console.log(`📧 login notification skipped for ${email}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Login Alert",
      html: `
        <h2>Login Notification</h2>
        <p>Your account was just logged in.</p>
        <p>If this wasn't you, please reset your password immediately.</p>
      `,
    });
  } catch (err) {
    console.error('❌ Failed to send login notification:', err);
  }
};

module.exports = {
  sendVerificationEmail,
  sendLoginNotification,
};