const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

// Always use the OS temp directory — guaranteed writeable on all platforms
// (local dev, Linux containers, Render, Heroku, etc.)
const BACKUP_DIR = path.join(os.tmpdir(), 'nile-backups');

/**
 * Ensures the backup directory exists. 
 * Called lazily when an operation is performed.
 */
const ensureBackupDir = () => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        return true;
    } catch (err) {
        console.error('Failed to access backup directory:', err.message);
        return false;
    }
};

/**
 * Get the path to PostgreSQL tools
 */
const getToolPath = (toolName) => {
    // Check if path is provided in .env
    const envPath = process.env[`${toolName.toUpperCase()}_PATH`];
    if (envPath) return envPath;

    // Default paths based on OS
    if (process.platform === 'win32') {
        const defaultWinPath = `C:\\Program Files\\PostgreSQL\\18\\bin\\${toolName}.exe`;
        if (fs.existsSync(defaultWinPath)) {
            return defaultWinPath;
        }
    }
    
    return toolName; // Default to global command
};

/**
 * Create a database backup
 */
const createBackup = () => {
    return new Promise((resolve, reject) => {
        if (!ensureBackupDir()) {
            return reject(new Error('Cannot access backup directory'));
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filepath = path.join(BACKUP_DIR, filename);
        
        const pgDump = getToolPath('pg_dump');
        const dbUrl = process.env.DATABASE_URL;

        if (!dbUrl) {
            return reject(new Error('DATABASE_URL is not defined in .env'));
        }

        const args = [
            `--dbname=${dbUrl}`,
            `--file=${filepath}`,
            '--clean',
            '--if-exists',
            '--no-owner',
            '--no-privileges'
        ];

        const child = spawn(pgDump, args, { shell: false });
        let stderr = '';

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`Backup error: Process exited with code ${code}`);
                console.error(`Stderr: ${stderr}`);
                return reject(new Error(`Database dump failed: ${stderr || 'Process exited with error'}`));
            }
            
            try {
                const stats = fs.statSync(filepath);
                resolve({
                    filename,
                    size: stats.size,
                    createdAt: stats.birthtime
                });
            } catch (statsError) {
                reject(new Error('Backup file was created but could not be verified'));
            }
        });
    });
};

/**
 * List all backups
 */
const listBackups = () => {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    
    try {
        return fs.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith('.sql'))
            .map(file => {
                const stats = fs.statSync(path.join(BACKUP_DIR, file));
                return {
                    filename: file,
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
        console.error('Error listing backups:', err.message);
        return [];
    }
};

/**
 * Restore a database from a backup file
 */
const restoreBackup = (filename) => {
    return new Promise((resolve, reject) => {
        // Sanitize filename to prevent path traversal
        const safeFilename = path.basename(filename);
        const filepath = path.join(BACKUP_DIR, safeFilename);
        
        if (!fs.existsSync(filepath)) {
            return reject(new Error('Backup file not found'));
        }

        const psql = getToolPath('psql');
        const dbUrl = process.env.DATABASE_URL;

        if (!dbUrl) {
            return reject(new Error('DATABASE_URL is not defined in .env'));
        }

        const args = [
            `--dbname=${dbUrl}`,
            `--file=${filepath}`
        ];

        const child = spawn(psql, args, { shell: false });
        let stderr = '';

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Restore error: Process exited with code ${code}`);
                console.error(`Stderr: ${stderr}`);
                return reject(new Error(`Restore failed: ${stderr || 'Process exited with error'}`));
            }

            try {
                await resetSequences();
                resolve({ success: true, message: 'Restore completed and sequences synchronized' });
            } catch (syncError) {
                console.warn(`Restore successful but sequence sync failed: ${syncError.message}`);
                resolve({ success: true, message: 'Restore completed but sequence synchronization failed' });
            }
        });
    });
};

/**
 * Reset all sequences
 */
const resetSequences = async () => {
    // Dynamic import to prevent circular dependency at startup
    const { pool } = require('../Database');
    
    const resetSql = `
        DO $$ 
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT table_name, column_name 
                      FROM information_schema.columns 
                      WHERE column_default LIKE 'nextval%' 
                      AND table_schema = 'public') 
            LOOP
                EXECUTE 'SELECT setval(pg_get_serial_sequence(''' || r.table_name || ''', ''' || r.column_name || '''), COALESCE(MAX(' || r.column_name || '), 1)) FROM ' || r.table_name;
            END LOOP;
        END $$;
    `;
    
    await pool.query(resetSql);
};

/**
 * Delete a backup file
 */
const deleteBackup = (filename) => {
    const safeFilename = path.basename(filename);
    const filepath = path.join(BACKUP_DIR, safeFilename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { success: true };
    }
    throw new Error('File not found');
};

module.exports = {
    BACKUP_DIR,
    createBackup,
    listBackups,
    restoreBackup,
    deleteBackup
};
