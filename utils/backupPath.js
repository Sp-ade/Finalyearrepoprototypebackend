const os = require('os');
const path = require('path');
const fs = require('fs');

/**
 * Returns the resolved path to the backups directory.
 * In production environments (NODE_ENV=production), it resolves to os.tmpdir() + 'nile-backups'.
 * In local environments, it falls back to Backend/backups.
 * Automatically ensures the directory is created.
 */
const getBackupDirectory = () => {
    let backupDir;
    if (process.env.NODE_ENV === 'production') {
        backupDir = path.join(os.tmpdir(), 'nile-backups');
    } else {
        backupDir = path.join(__dirname, '../backups');
    }

    try {
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
    } catch (err) {
        console.error('Error creating backups folder:', err.message);
    }

    return backupDir;
};

module.exports = { getBackupDirectory };
