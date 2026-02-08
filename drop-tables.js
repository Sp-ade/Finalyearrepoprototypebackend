const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:pgfinalyeartest@localhost:5432/nilefinalyeardb'
})

async function dropTables() {
    try {
        console.log('Dropping existing tables...')

        await pool.query('DROP TABLE IF EXISTS Students CASCADE')
        console.log('✓ Dropped Students table')

        await pool.query('DROP TABLE IF EXISTS Supervisors CASCADE')
        console.log('✓ Dropped Supervisors table')

        await pool.query('DROP TABLE IF EXISTS Users CASCADE')
        console.log('✓ Dropped Users table')

        console.log('\n✅ All tables dropped successfully!')
        console.log('Now run: npm run migrate')
    } catch (err) {
        console.error('❌ Error:', err.message)
    } finally {
        await pool.end()
    }
}

dropTables()
