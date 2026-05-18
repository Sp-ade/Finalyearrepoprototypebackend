// Script to create admin account
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:pgfinalyeartest@localhost:5432/nilefinalyeardb'
});

async function createAdminAccount() {
    const client = await pool.connect();

    try {
        console.log('🔐 Checking for existing admin account...');
        const checkResult = await client.query('SELECT * FROM Users WHERE email = $1', ['ade.admin@nileuniversity.edu.ng']);
        
        if (checkResult.rows.length > 0) {
            console.log('✅ Admin account already exists. Skipping creation.');
            return;
        }

        console.log('🔐 Creating admin account...');

        // Hash the password
        const password = 'password123';
        const passwordHash = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed');

        // Insert into Users table
        const userResult = await client.query(
            `INSERT INTO Users (email, password_hash, first_name, last_name, role, is_active, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = $2, is_active = $6, is_verified = true
       RETURNING id, email, role`,
            ['ade.admin@nileuniversity.edu.ng', passwordHash, 'Ade', 'Admin', 'admin', true]
        );

        console.log('✅ User created:', userResult.rows[0]);

        const userId = userResult.rows[0].id;

        // Insert into admins table
        await client.query(
            `INSERT INTO admins (user_id, admin_level)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE 
       SET admin_level = $2`,
            [userId, 'SuperAdmin']
        );

        console.log('✅ Admin level set to SuperAdmin');

        // Verify
        const verifyResult = await client.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, a.admin_level
       FROM Users u
       LEFT JOIN admins a ON u.id = a.user_id
       WHERE u.email = $1`,
            ['ade.admin@nileuniversity.edu.ng']
        );

        console.log('\n✅ Admin account created successfully!');
        console.log('📋 Account details:', verifyResult.rows[0]);
        console.log('\n🔑 Login credentials:');
        console.log('   Email: ade.admin@nileuniversity.edu.ng');
        console.log('   Password: password123');
        console.log('   URL: http://localhost:5173/adminlogin');

    } catch (error) {
        console.error('❌ Error creating admin account:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    createAdminAccount();
} else {
    module.exports = createAdminAccount;
}
