const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configure local storage for database backups.
 * Files are saved to the ../backups directory.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        cb(null, backupDir);
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
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB max
    },
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.sql') {
            cb(null, true);
        } else {
            cb(new Error('Only .sql files are allowed'));
        }
    }
});

module.exports = backupUpload;
