const express = require('express')
const router = express.Router()
const controller = require('../controllers/authcontroller')

router.post('/login', controller.login)
router.get('/me', controller.getUserByEmail)
router.get('/verify-email', controller.verifyEmail)
// router.post('/register', controller.register) // optional
module.exports = router