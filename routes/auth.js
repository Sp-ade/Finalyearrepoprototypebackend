const express = require('express')
const router = express.Router()
const controller = require('../controllers/authcontroller')
const signupController = require('../controllers/signupController')

router.post('/signup', signupController.signup)
router.post('/login', controller.login)
router.get('/me', controller.getUserByEmail)
router.get('/verify-email', controller.verifyEmail)
// testing helper: immediately mark an email verified and add any missing columns
router.post('/force-verify', controller.forceVerify)
// send a simple test email to given address
router.post('/send-test-email', controller.sendTestEmail)
// update user password
router.post('/update-password', controller.updatePassword)
//forgot your password (not yet implemented)
// router.post('/forgot-password', controller.forgotPassword)
// router.post('/register', controller.register) // optional
module.exports = router