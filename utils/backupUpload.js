const multer = require('multer');
const path = require('path');

/**
 * Use memoryStorage so multer never tries to write to disk itself.
 * This prevents silent failures on Render's ephemeral filesystem where
 * a disk write error would cause req.file to be undefined.
 * The controller is responsible for persisting req.file.buffer to disk.
 */
const backupUpload = multer({
    storage: multer.memoryStorage(),
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
