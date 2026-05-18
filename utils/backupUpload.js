const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { BACKUP_DIR } = require('../services/backupService');

/**
 * Configure local storage for database backups.
 * Files are saved to the dynamic backups directory.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        cb(null, BACKUP_DIR);
    },
    filename: (req, file, cb) => {
        // Use original name but ensure it has .sql extension
        const name = file.originalname.endsWith('.sql') ? file.originalname : `${file.originalname}.sql`;
        cb(null, name);
    }
});

/**
 * Multer middleware for database backup uploads.
 * Restricts uploads to .sql files only.
 */
const backupUpload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.sql') {
            cb(null, true);
        } else {
            cb(new Error('Only .sql files are allowed'));
        }
    }
});

module.exports = backupUpload;
