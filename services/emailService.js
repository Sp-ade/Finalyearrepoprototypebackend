const https = require('https');
const templates = require('../utils/templates');
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
      html: templates.verificationEmailHtml(verificationLink),
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
      html: templates.loginNotificationHtml(),
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
      html: templates.groupFormationEmailHtml({ supervisorName, groupNumber, year, role }),
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
      html: templates.resetPasswordEmailHtml(resetLink),
    });
    console.log(`✅ Reset password email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send reset password email:', err.message);
  }
};

/**
 * Send contact form submission to admin
 */
const sendContactEmail = async ({ fromName, fromEmail, message }) => {
  const adminEmail = process.env.EMAIL_USER; // Sending to the system admin
  console.log(`📧 Sending contact form message from: ${fromEmail}`);

  try {
    await sendEmail({
      to: adminEmail,
      subject: `New Contact Form Submission: ${fromName}`,
      html: templates.contactEmailHtml({ fromName, fromEmail, message }),
    });
    console.log(`✅ Contact email sent from ${fromEmail}`);
  } catch (err) {
    console.error('❌ Failed to send contact email:', err.message);
    throw err;
  }
};

/**
 * Send project submission notification to supervisor
 */
const sendSubmissionEmail = async (email, { supervisorName, groupName, leaderName, projectTitle }) => {
  console.log(`📧 Sending submission notification email to: ${email}`);

  try {
    await sendEmail({
      to: email,
      subject: `New Project Submission: ${projectTitle}`,
      html: templates.submissionEmailHtml({ supervisorName, groupName, leaderName, projectTitle }),
    });
    console.log(`✅ Submission notification email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send submission notification email:', err.message);
  }
};

module.exports = {
  sendVerificationEmail,
  sendLoginNotification,
  sendResetPasswordEmail,
  sendGroupFormationEmail,
  sendContactEmail,
  sendSubmissionEmail,
};
