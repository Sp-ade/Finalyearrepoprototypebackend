const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const verificationLink =
    `http://localhost:3000/api/verify-email?token=${token}`;

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

        <p>If you're having trouble clicking the "Verify Email" button,
        copy and paste the URL below into your web browser:</p>

        <p style="word-break: break-all; color: blue;">
          ${verificationLink}
        </p>

        <p>This link expires in 1 hour.</p>
      </div>
    `,
  });
};

const sendLoginNotification = async (email) => {
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
};

module.exports = {
  sendVerificationEmail,
  sendLoginNotification,
};