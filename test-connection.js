const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:pgfinalyeartest@localhost:5432/nilefinalyeardb'
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('❌ Connection failed:', err.message);
        console.log('\nTry these steps:');
        console.log('1. Open pgAdmin');
        console.log('2. Connect to your server');
        console.log('3. Check what password works');
        console.log('4. Update .env file with that password');
    } else {
        console.log('✅ Connected successfully!');
        console.log('Current time:', res.rows[0].now);
    }
    pool.end();
});
