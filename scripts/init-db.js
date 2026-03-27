require('dotenv').config();

// Security Guard: Prevent accidental execution in production
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DANGEROUS_SCRIPTS !== 'true') {
  console.error('\n❌ ERROR: SEEDING BLOCKED');
  console.error('This script (init-db) is restricted in production to prevent accidental data modification.');
  console.error('To override, set ALLOW_DANGEROUS_SCRIPTS=true in your environment.\n');
  process.exit(1);
}

const db = require('../Database')
const bcrypt = require('bcrypt')

async function run() {
  try {
    await db.init()
    console.log('Tables ensured')

    // create a demo user if not exists
    const email = process.env.SEED_EMAIL || 'test@nileuniversity.edu.ng'
    const password = process.env.SEED_PASSWORD || 'password123'
    const firstName = process.env.SEED_FIRST_NAME || 'Test'
    const lastName = process.env.SEED_LAST_NAME || 'User'
    const role = process.env.SEED_ROLE || 'student'
    const studentId = process.env.SEED_STUDENT_ID || 'TEST001'
    const department = process.env.SEED_DEPARTMENT || 'Computer Science'

    const hashed = await bcrypt.hash(password, 10)
    const user = await db.createUser(email, hashed, firstName, lastName, role, studentId, department)
    if (user) console.log('Seeded user', user.email, `(${user.role})`)
    else console.log('User already exists or was not created')
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

run()
