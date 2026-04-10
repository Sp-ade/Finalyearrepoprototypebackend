const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Get the path to PostgreSQL tools
 */
const getToolPath = (toolName) => {
    // Check if path is provided in .env
    const envPath = process.env[`${toolName.toUpperCase()}_PATH`];
    if (envPath) return envPath;

    // Default paths based on OS
    if (process.platform === 'win32') {
        // Fallback for common local installation found during research
        const defaultWinPath = `C:\\Program Files\\PostgreSQL\\18\\bin\\${toolName}.exe`;
        if (fs.existsSync(defaultWinPath)) {
            return `"${defaultWinPath}"`;
        }
        return toolName; // Try if it's in PATH
    }
    
    return toolName; // For Linux/Render, usually in PATH
};

/**
 * Create a database backup
 */
const createBackup = () => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filepath = path.join(BACKUP_DIR, filename);
        
        const pgDump = getToolPath('pg_dump');
        const dbUrl = process.env.DATABASE_URL;

        if (!dbUrl) {
            return reject(new Error('DATABASE_URL is not defined in .env'));
        }

        // Use --clean to drop objects before creating them, and --if-exists to avoid errors on drop
        // --no-owner and --no-privileges make the backup more portable
        const command = `${pgDump} --dbname="${dbUrl}" --file="${filepath}" --clean --if-exists --no-owner --no-privileges`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Backup error: ${error.message}`);
                console.error(`Stderr: ${stderr}`);
                return reject(error);
            }
            
            const stats = fs.statSync(filepath);
            resolve({
                filename,
                size: stats.size,
                createdAt: stats.birthtime
            });
        });
    });
};

/**
 * List all backups
 */
const listBackups = () => {
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
};

/**
 * Restore a database from a backup file
 */
const restoreBackup = (filename) => {
    return new Promise((resolve, reject) => {
        const filepath = path.join(BACKUP_DIR, filename);
        
        if (!fs.existsSync(filepath)) {
            return reject(new Error('Backup file not found'));
        }

        const psql = getToolPath('psql');
        const dbUrl = process.env.DATABASE_URL;

        if (!dbUrl) {
            return reject(new Error('DATABASE_URL is not defined in .env'));
        }

        // For restore, we might want to drop and recreate the schema or tables.
        // But simply running the SQL file usually works if the file contains 
        // DROP TABLE IF EXISTS or similar, or if we're restoring to a clean DB.
        // Standard pg_dump doesn't include DROPs unless -c is specified.
        
        const command = `${psql} --dbname="${dbUrl}" --file="${filepath}"`;

        exec(command, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Restore error: ${error.message}`);
                console.error(`Stderr: ${stderr}`);
                return reject(error);
            }

            try {
                // Sync sequences after restore to prevent "duplicate key" errors
                await resetSequences();
                resolve({ success: true, message: 'Restore completed and sequences synchronized successfully' });
            } catch (syncError) {
                console.warn(`Restore successful but sequence sync failed: ${syncError.message}`);
                resolve({ success: true, message: 'Restore completed but sequence synchronization failed' });
            }
        });
    });
};

/**
 * Reset all sequences in the public schema to their correct values
 * This prevents "duplicate key value violates unique constraint" errors after a restore
 */
const resetSequences = async () => {
    const { pool } = require('../Database');
    
    // This PL/pgSQL block finds all columns with nextval() defaults and resets their sequences
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
    const filepath = path.join(BACKUP_DIR, filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return { success: true };
    }
    throw new Error('File not found');
};

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    deleteBackup
};
