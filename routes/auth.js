const express = require('express')
const router = express.Router()
const controller = require('../controllers/authcontroller')
const signupController = require('../controllers/signupController')
const { authenticate, isAdmin } = require('../middleware/auth')
const loginRateLimiter = require('../middleware/loginRateLimiter')

router.post('/signup', signupController.signup)
router.post('/login', loginRateLimiter, controller.login)
router.post('/logout', authenticate, controller.logout)
router.get('/me', authenticate, controller.getUserByEmail)
router.get('/verify-email', controller.verifyEmail)
// testing helper: immediately mark an email verified and add any missing columns
router.post('/force-verify', authenticate, isAdmin, controller.forceVerify)
// send a simple test email to given address
router.post('/send-test-email', authenticate, isAdmin, controller.sendTestEmail)
// update user password
router.post('/update-password', authenticate, controller.updatePassword)
// forgot your password
router.post('/forgot-password', controller.forgotPassword)
router.get('/reset-password', controller.renderResetPasswordPage)
router.post('/reset-password', express.urlencoded({ extended: true }), controller.handleResetPassword)

module.exports = router