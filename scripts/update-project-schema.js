const db = require('../Database');

async function updateProjectSchema() {
    try {
        console.log('Updating Projects table schema...');

        // Add name column if it doesn't exist
        await db.query(`
            ALTER TABLE Projects 
            ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        `);
        console.log('✓ Added name column');

        // Add category column if it doesn't exist
        await db.query(`
            ALTER TABLE Projects 
            ADD COLUMN IF NOT EXISTS category VARCHAR(50);
        `);
        console.log('✓ Added category column');

        console.log('\n✅ Schema update completed successfully!');
    } catch (error) {
        console.error('❌ Error updating schema:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    updateProjectSchema()
        .then(() => {
            console.log('\nSchema update complete!');
            process.exit(0);
        })
        .catch(err => {
            console.error('\nSchema update failed:', err);
            process.exit(1);
        });
}

module.exports = updateProjectSchema;
