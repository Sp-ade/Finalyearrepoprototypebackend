const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getBackupDirectory } = require('./backupPath');

/**
 * Configure local storage for database backups.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, getBackupDirectory());
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
