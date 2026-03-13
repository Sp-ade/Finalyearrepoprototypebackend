const db = require('./Database')
const bcrypt = require('bcrypt')

async function createAdmin() {
    try {
        const email = 'ade.admin@nileuniversity.edu.ng'
        const password = 'password123'
        const firstName = 'Ade'
        const lastName = 'Admin'
        const role = 'admin'

        // Check if a user with this email already exists
        const existing = await db.findUserByEmail(email)
        if (existing) {
            console.log(`User with email "${email}" already exists (id: ${existing.id}, role: ${existing.role}). Skipping creation.`)
            return
        }

        const hashed = await bcrypt.hash(password, 10)

        // We pass null for roleSpecificId and department for admin
        const user = await db.createUser(email, hashed, firstName, lastName, role)

        if (user) {
            console.log('Successfully created admin user:', user.email)
            // verify manually if needed
            await db.query('UPDATE Users SET is_verified = true WHERE id = $1', [user.id])
            console.log('Admin user verified')
        } else {
            console.log('User was not created')
        }
    } catch (err) {
        console.error('Error creating admin:', err)
    }
}

module.exports = createAdmin
