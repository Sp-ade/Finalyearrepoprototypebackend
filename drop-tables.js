const db = require('./Database');
const { cloudinary } = require('./utils/cloudinary');
require('dotenv').config();

/**
 * Extracts Cloudinary public ID and resource type from a URL
 */
function getCloudinaryInfo(url) {
    if (!url || !url.includes('cloudinary.com')) return null;

    try {
        const urlParts = url.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) return null;

        let publicIdParts = urlParts.slice(uploadIndex + 1);

        // Remove version (v1234567) if present
        if (publicIdParts.length > 0 && publicIdParts[0].startsWith('v') && !isNaN(parseInt(publicIdParts[0].substring(1)))) {
            publicIdParts = publicIdParts.slice(1);
        }

        const fullPath = publicIdParts.join('/');

        // Determine resource type - documents and project artifacts are usually 'raw'
        const resourceType = (url.includes('/raw/') || url.includes('/project_artifacts/') || url.includes('/documents/')) ? 'raw' : 'image';

        // For 'raw' files, the public_id includes the extension. For images, it does not.
        let publicId = fullPath;
        if (resourceType !== 'raw') {
            const lastDotIndex = fullPath.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                publicId = fullPath.substring(0, lastDotIndex);
            }
        }

        return { publicId, resourceType };
    } catch (err) {
        console.error('Error parsing Cloudinary URL:', err.message);
        return null;
    }
}

async function dropTables() {
    try {
        console.log('🚀 Starting full system reset...');

        // 1. Fetch and delete Cloudinary assets
        console.log('\n--- 📁 Cloudinary Cleanup ---');
        try {
            const artifacts = await db.query('SELECT file_path FROM Project_Artifacts');
            console.log(`Found ${artifacts.rows.length} artifacts to check.`);

            for (const row of artifacts.rows) {
                const info = getCloudinaryInfo(row.file_path);
                if (info) {
                    console.log(`Deleting from Cloudinary: ${info.publicId} (${info.resourceType})`);
                    try {
                        await cloudinary.uploader.destroy(info.publicId, { resource_type: info.resourceType });
                    } catch (cloudErr) {
                        console.warn(`⚠️ Failed to delete ${info.publicId}:`, cloudErr.message);
                    }
                }
            }
        } catch (dbErr) {
            console.warn('⚠️ Could not fetch artifacts (table might not exist yet):', dbErr.message);
        }

        // 2. Drop Database Tables
        console.log('\n--- 🗄️ Database Cleanup ---');
        const tables = [
            'Project_Artifacts',
            'Project_Tags',
            'Access_Requests_Student',
            'Project_Submissions',
            'Tags',
            'Projects',
            'Students',
            'Supervisors',
            'admins',
            'Users'
        ];

        for (const table of tables) {
            try {
                await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
                console.log(`✓ Dropped ${table} table`);
            } catch (err) {
                console.error(`❌ Error dropping ${table}:`, err.message);
            }
        }

        console.log('\n✅ System reset successful! Database and Cloudinary are clean.');
    } catch (err) {
        console.error('\n❌ Critical Reset Error:', err.message);
        throw err; // Propagate error so index.js knows
    }
}

// Run if executed directly, otherwise export
if (require.main === module) {
    dropTables()
        .then(() => {
            console.log('Now run your migration scripts to re-initialize.');
            return db.pool.end();
        })
        .catch(err => {
            process.exit(1);
        });
}

module.exports = dropTables;
