const express = require('express')
const router = express.Router()
const db = require('../Database')
const bcrypt = require('bcrypt')

router.post('/signup', async (req, res, next) => {
    try {
        const { email, password, firstName, lastName, role, studentId, department } = req.body

        // Validate required fields
        if (!email || !password || !firstName || !lastName || !role || !studentId) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        // Validate department for students
        if (role === 'student' && !department) {
            return res.status(400).json({ message: 'Department is required for students' })
        }

        // Validate email domain
        if (!email.endsWith('@nileuniversity.edu.ng')) {
            return res.status(400).json({ message: 'Email must be from @nileuniversity.edu.ng domain' })
        }

        // Validate email format for students (must be digits@nileuniversity.edu.ng)
        if (role === 'student') {
            const emailPrefix = email.split('@')[0]
            if (!/^\d+$/.test(emailPrefix)) {
                return res.status(400).json({ message: 'Student email must be in format: digits@nileuniversity.edu.ng (e.g., 123456@nileuniversity.edu.ng)' })
            }
        }

        // Validate role
        if (!['student', 'supervisor'].includes(role)) {
            return res.status(400).json({ message: 'Role must be either student or supervisor' })
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' })
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Create user (with role-specific ID and department for students)
        const user = await db.createUser(email, passwordHash, firstName, lastName, role, studentId, department)

        if (!user) {
            return res.status(409).json({ message: 'User with this email or ID already exists' })
        }

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        })
    } catch (err) {
        // Handle unique constraint violations
        if (err.code === '23505') {
            return res.status(409).json({ message: 'User with this email or ID already exists' })
        }
        next(err)
    }
})

module.exports = router
