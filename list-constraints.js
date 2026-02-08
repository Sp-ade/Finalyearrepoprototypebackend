const db = require('./Database');

async function listConstraints() {
    try {
        console.log('Listing constraints for Projects table...');

        const res = await db.query(`
            SELECT conname, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'Projects'::regclass;
        `);

        console.table(res.rows);

    } catch (err) {
        console.error('Error listing constraints:', err);
    }
}

if (require.main === module) {
    listConstraints().then(() => process.exit(0));
}
