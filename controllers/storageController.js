const { cloudinary } = require('../utils/cloudinary');
const db = require('../Database');
const activityService = require('../services/activityService');
const authService = require('../services/authservice');

/**
 * Identify and delete unreferenced files from Cloudinary
 */
const cleanupCloudinary = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: 'Admin password is required for storage cleanup' });
        }

        // Verify password
        try {
            await authService.verifyPassword(req.user.email, password);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid admin password' });
        }

        console.log('🚀 Starting Cloudinary storage cleanup...');

        // 1. Get folders to clean from environment variables
        const foldersToClean = [
            process.env.CLOUDINARY_PROJECT_FOLDER,
            process.env.CLOUDINARY_DOCS_FOLDER
        ].filter(Boolean);

        if (foldersToClean.length === 0) {
            console.warn('⚠️ No storage folders defined in environment variables. Defaulting to standard folders.');
            foldersToClean.push('project_artifacts', 'documents');
        }

        console.log(`[StorageCleanup] Scoping to folders: ${foldersToClean.join(', ')}`);

        // 2. Get all artifact URLs from the database
        const dbResult = await db.query('SELECT file_path FROM Project_Artifacts');
        const dbUrls = dbResult.rows.map(row => row.file_path).filter(Boolean);
        console.log(`[StorageCleanup] Found ${dbUrls.length} referenced files in database.`);

        // 3. Scan Cloudinary for files
        let ghostFiles = [];
        let totalScanned = 0;
        const resourceTypes = ['image', 'raw'];

        for (const folder of foldersToClean) {
            for (const type of resourceTypes) {
                try {
                    // Search for resources with the folder prefix
                    // Note: Cloudinary prefix search doesn't require a trailing slash
                    const result = await cloudinary.api.resources({
                        type: 'upload',
                        resource_type: type,
                        prefix: folder,
                        max_results: 500
                    });

                    console.log(`[StorageCleanup] Found ${result.resources.length} ${type} resources with prefix "${folder}"`);

                    for (const resource of result.resources) {
                        totalScanned++;

                        // Robust matching: Check if the public_id or URLs appear in any DB record
                        const isReferenced = dbUrls.some(dbUrl =>
                            dbUrl.includes(resource.public_id) ||
                            dbUrl.includes(encodeURI(resource.public_id)) ||
                            dbUrl.includes(resource.secure_url) ||
                            dbUrl.includes(resource.url)
                        );

                        if (!isReferenced) {
                            ghostFiles.push({
                                public_id: resource.public_id,
                                resource_type: type,
                                folder: folder
                            });
                        }
                    }
                } catch (err) {
                    console.error(`[StorageCleanup] Error scanning ${type} in ${folder}:`, err.message);
                }
            }
        }

        console.log(`[StorageCleanup] Identified ${ghostFiles.length} ghost files.`);

        // 4. Delete the ghost files
        let deletedCount = 0;
        for (const file of ghostFiles) {
            try {
                // IMPORTANT: For 'raw' files, extension is usually part of public_id
                await cloudinary.uploader.destroy(file.public_id, {
                    resource_type: file.resource_type,
                    invalidate: true
                });
                deletedCount++;
            } catch (err) {
                console.error(`[StorageCleanup] Failed to delete ${file.public_id}:`, err.message);
            }
        }

        if (deletedCount > 0) {
            await activityService.logStorageCleanup(req.user.sub, {
                totalScanned,
                deletedCount
            });
        }

        res.status(200).json({
            success: true,
            message: `Cleanup completed successfully.`,
            stats: {
                totalScanned,
                ghostFilesFound: ghostFiles.length,
                deletedCount
            }
        });

    } catch (error) {
        console.error('Error during storage cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Error during storage cleanup',
            error: error.message
        });
    }
};

module.exports = {
    cleanupCloudinary
};
