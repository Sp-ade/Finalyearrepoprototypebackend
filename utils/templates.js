/**
 * HTML Templates for Auth Responses
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Browser Pages:
 * - verificationSuccess
 * - verificationFailed
 * - confirmVerificationPage
 * - resetPasswordForm
 * - resetPasswordSuccess
 * - resetPasswordFailed
 * 
 * Email Bodies:
 * - verificationEmailHtml
 * - loginNotificationHtml
 * - groupFormationEmailHtml
 * - resetPasswordEmailHtml
 * - contactEmailHtml
 */

exports.verificationSuccess = `
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
`;

exports.verificationFailed = `
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
`;

exports.confirmVerificationPage = (token, backendUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Verification | Nile University Repository</title>
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
        .icon-wrapper {
            width: 80px; height: 80px; background: #e0e7ff; border-radius: 50%;
            display: flex; justify-content: center; align-items: center; margin: 0 auto 2rem;
        }
        .icon { width: 40px; height: 40px; color: var(--primary); }
        h1 { font-size: 28px; font-weight: 700; margin: 0 0 1rem; letter-spacing: -0.025em; }
        p { color: var(--text-muted); line-height: 1.6; margin-bottom: 2.5rem; font-size: 16px; }
        .btn {
            display: block; width: 100%; background: var(--primary); color: white; padding: 14px;
            text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: none; cursor: pointer; font-family: 'Outfit', sans-serif;
        }
        .btn:hover { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(43, 69, 147, 0.2); }
        .footer { margin-top: 2rem; font-size: 14px; color: var(--text-muted); }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-wrapper">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        </div>
        <h1>Verify Your Account</h1>
        <p>Please click the button below to complete your registration and verify your email address.</p>
        <form action="${backendUrl}/api/verify-email" method="POST">
            <input type="hidden" name="token" value="${token}">
            <button type="submit" class="btn">Verify My Account</button>
        </form>
        <div class="footer">Nile University Repository</div>
    </div>
</body>
</html>
`;

exports.resetPasswordForm = (token, backendUrl) => `
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
        .password-policy {
            text-align: left;
            background: #f8fafc;
            padding: 12px 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
        }
        .password-policy p {
            font-size: 13px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #475569;
        }
        .password-policy ul {
            margin: 0;
            padding: 0 0 0 18px;
            list-style-type: disc;
        }
        .password-policy li {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 4px;
        }
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
        <p>Your new password must be at least 8 characters long.</p>
        <form action="${backendUrl}/api/reset-password" method="POST" onsubmit="return validateForm()">
            <input type="hidden" name="token" value="${token}">
            <div class="form-group">
                <label for="password">New Password</label>
                <input type="password" id="password" name="password" placeholder="Enter new password" required>
            </div>
            
            <div class="password-policy">
                <p>Your password must meet the following requirements:</p>
                <ul>
                    <li>At least 8 characters long</li>
                    <li>One uppercase letter (A-Z)</li>
                    <li>One lowercase letter (a-z)</li>
                    <li>One number (0-9)</li>
                    <li>One special character (e.g., !@#$%^&*)</li>
                </ul>
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
`;

exports.resetPasswordSuccess = `
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
`;

exports.resetPasswordFailed = (errorMessage, token) => {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
    // If the error isn't about the token itself, let them try again at the reset form
    const isTokenError = errorMessage && (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('expired'));

    const retryUrl = (token && !isTokenError)
        ? `${BACKEND_URL}/api/render-reset-password?token=${token}`
        : `${FRONTEND_URL}/forgot-password`;

    return `
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
        <p>${errorMessage || 'The password reset link is invalid or has expired. Please request a new one.'}</p>
        <a href="${retryUrl}" class="btn">Try Again</a>
        <div class="footer">Nile University Repository</div>
    </div>
</body>
</html>
`;
};


/**
 * Verification email body
 */
exports.verificationEmailHtml = (verificationLink) => `
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
`;

/**
 * Login security alert email body
 */
exports.loginNotificationHtml = () => `
  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
    <h2 style="color: #2b4593;">Security Alert</h2>
    <p>Your account was just logged in to the Nile University Repository.</p>
    <p>If this was not you, please reset your password immediately to secure your account.</p>
  </div>
`;

/**
 * Group formation/assignment email body
 */
exports.groupFormationEmailHtml = ({ supervisorName, groupNumber, year, role }) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `
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
        <a href="${frontendUrl}/dashboard"
           style="background-color: #2b4593; color: white; padding: 14px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          View Dashboard
        </a>
      </div>
      <p style="color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
        This is an automated notification from the Nile University Repository.
      </p>
    </div>
  `;
};

/**
 * Password reset email body
 */
exports.resetPasswordEmailHtml = (resetLink) => `
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
`;

/**
 * Contact form email body (sent to admin)
 */
exports.contactEmailHtml = ({ fromName, fromEmail, message }) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto;">
    <h2 style="color: #2b4593; text-align: center;">New Complaint/Suggestion</h2>
    <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; color: #1a202c;">${message}</p>
    </div>
    <p style="color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
      This message was sent via the Nile University Repository contact form.
    </p>
  </div>
`;
