const adminService = require('../services/adminService');
const activityService = require('../services/activityService');
const backupService = require('../services/backupService');
const authService = require('../services/authservice');
const fs = require('fs');
const path = require('path');

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
    try {
        const { role, search, limit, offset } = req.query;
        const result = await adminService.getAllUsers({ role, search, limit, offset });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

/**
 * Get user statistics
 */
const getUserStats = async (req, res) => {
    try {
        const result = await adminService.getUserStats();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

/**
 * Update user status
 */
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const result = await adminService.updateUserStatus(parseInt(id), isActive);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
};

/**
 * Permanently delete a user
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admins from deleting themselves via this route for safety
        if (parseInt(id) === req.user.sub) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account while logged in.'
            });
        }

        const result = await adminService.deleteUser(parseInt(id));

        if (!result.success) {
            return res.status(404).json(result);
        }

        // Log the activity
        await activityService.log(null, req.user.sub, 'USER_DELETED', result.message);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

/**
 * Update user details with admin password verification
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { userData, adminPassword } = req.body;

        if (!adminPassword) {
            return res.status(400).json({
                success: false,
                message: 'Admin password is required to perform this update'
            });
        }

        // 1. Verify Admin Password
        try {
            await authService.verifyPassword(req.user.email, adminPassword);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin password. Verification failed.'
            });
        }

        // 2. Call service to update user
        const result = await adminService.updateUser(parseInt(id), userData);

        if (!result.success) {
            return res.status(404).json(result);
        }

        // 3. Log the activity
        await activityService.log(
            null,
            req.user.sub,
            'USER_UPDATED',
            `Updated details for user ${userData.email || id}`
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

/**
 * Get project statistics
 */
const getProjectStats = async (req, res) => {
    try {
        const result = await adminService.getProjectStats();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching project stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching project statistics',
            error: error.message
        });
    }
};

/**
 * Get request statistics
 */
const getRequestStats = async (req, res) => {
    try {
        const result = await adminService.getRequestStats();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching request stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching request statistics',
            error: error.message
        });
    }
};

/**
 * Get all requests
 */
const getAllRequests = async (req, res) => {
    try {
        const { status, limit, offset } = req.query;
        const result = await adminService.getAllRequests({ status, limit, offset });

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching requests',
            error: error.message
        });
    }
};

/**
 * Get dashboard analytics
 */
const getDashboardAnalytics = async (req, res) => {
    try {
        const result = await adminService.getDashboardAnalytics();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard analytics',
            error: error.message
        });
    }
};

/**
 * Get all tags
 */
const getAllTags = async (req, res) => {
    try {
        const result = await adminService.getAllTags();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tags',
            error: error.message
        });
    }
};

/**
 * Update tag
 */
const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Tag name is required'
            });
        }

        const result = await adminService.updateTag(parseInt(id), name);

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating tag',
            error: error.message
        });
    }
};

/**
 * Delete tag
 */
const deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminService.deleteTag(parseInt(id));

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting tag',
            error: error.message
        });
    }
};

/**
 * Reassign supervisor for a student leader
 */
const reassignLeaderSupervisor = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { newSupervisorId } = req.body;

        if (!newSupervisorId) {
            return res.status(400).json({
                success: false,
                message: 'New supervisor ID is required'
            });
        }

        const result = await adminService.reassignLeaderSupervisor(
            parseInt(studentId),
            parseInt(newSupervisorId)
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error reassigning leader supervisor:', error);
        res.status(500).json({
            success: false,
            message: 'Error reassigning supervisor',
            error: error.message
        });
    }
};

/**
 * Reassign supervisor for a project
 */
const reassignProjectSupervisor = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { newSupervisorId } = req.body;

        if (!newSupervisorId) {
            return res.status(400).json({
                success: false,
                message: 'New supervisor ID is required'
            });
        }

        const result = await adminService.reassignProjectSupervisor(
            parseInt(projectId),
            parseInt(newSupervisorId)
        );

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Audit Logging
        if (result.success) {
            await activityService.logSupervisorReassigned(
                parseInt(projectId),
                req.user.sub,
                "Previous Supervisor", // We don't have the old name easily here without extra fetch
                "New Supervisor"
            );
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error reassigning project supervisor:', error);
        res.status(500).json({
            success: false,
            message: 'Error reassigning supervisor',
            error: error.message
        });
    }
};

/**
 * Demote a student leader
 */
const demoteStudentLeader = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await adminService.demoteStudentLeader(parseInt(studentId));

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Log the activity
        await activityService.log(null, req.user.sub, 'STUDENT_DEMOTED', `Demoted student (${result.student.student_matric_no}) from leadership role`);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error demoting student leader:', error);
        res.status(500).json({
            success: false,
            message: 'Error demoting student leader',
            error: error.message
        });
    }
};

/**
 * Get all groups (admin view)
 */
const getAllGroups = async (req, res) => {
    try {
        const result = await adminService.getAllGroups();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ success: false, message: 'Error fetching groups', error: error.message });
    }
};

/**
 * Disband a group (admin only)
 */
const disbandGroup = async (req, res) => {
    try {
        const { groupNumber, year } = req.params;
        const result = await adminService.disbandGroup(parseInt(groupNumber), parseInt(year));

        if (!result.success) {
            return res.status(404).json(result);
        }

        await activityService.log(null, req.user.sub, 'GROUP_DISBANDED', `Disbanded Group ${groupNumber} (${year}): ${result.disbandedCount} student(s) reset`);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error disbanding group:', error);
        res.status(500).json({ success: false, message: 'Error disbanding group', error: error.message });
    }
};

/**
 * Update group details (Admin override)
 */
const updateGroup = async (req, res) => {
    try {
        const { groupNumber, year } = req.params;
        const { leaderId, memberIds, newSupervisorId } = req.body;

        if (!leaderId || !newSupervisorId) {
            return res.status(400).json({
                success: false,
                message: 'Leader ID and New Supervisor ID are required'
            });
        }

        const result = await adminService.updateGroup(
            parseInt(groupNumber),
            parseInt(year),
            leaderId,
            memberIds,
            newSupervisorId
        );

        // Log the activity
        await activityService.log(
            null, 
            req.user.sub, 
            'GROUP_UPDATED_ADMIN', 
            `Admin updated details for Group ${groupNumber} (${year})`
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating group',
            error: error.message
        });
    }
};

/**
 * Get all activity logs with pagination and filters
 */
const getAllActivityLogs = async (req, res) => {
    try {
        const { limit, offset, search, action: actionType, role } = req.query;
        const result = await adminService.getAllActivityLogs({
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
            search,
            actionType,
            role
        });
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching activity logs',
            error: error.message
        });
    }
};

/**
 * Get available action types for filtering logs
 */
const getLogActionTypes = async (req, res) => {
    try {
        const result = await adminService.getLogActionTypes();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching action types:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching action types',
            error: error.message
        });
    }
};

/**
 * Get all pending submissions
 */
const getPendingSubmissions = async (req, res) => {
    try {
        const result = await adminService.getPendingSubmissions();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching pending submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending submissions',
            error: error.message
        });
    }
};

/**
 * List all database backups
 */
const listBackups = async (req, res) => {
    try {
        const backups = backupService.listBackups();
        res.status(200).json({ success: true, backups });
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({ success: false, message: 'Error listing backups', error: error.message });
    }
};

/**
 * Create a new database backup
 */
const createBackup = async (req, res) => {
    try {
        const backup = await backupService.createBackup();

        // Log the activity
        await activityService.log(null, req.user.sub, 'DATABASE_BACKUP', `Created database backup: ${backup.filename}`);

        res.status(201).json({ success: true, backup, message: 'Backup created successfully' });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ success: false, message: 'Error creating backup', error: error.message });
    }
};

/**
 * Restore from a backup
 */
const restoreBackup = async (req, res) => {
    try {
        const { filename, password } = req.body;
        if (!filename) {
            return res.status(400).json({ success: false, message: 'Filename is required' });
        }

        if (!password) {
            return res.status(400).json({ success: false, message: 'Admin password is required for database restoration' });
        }

        // Verify password
        try {
            await authService.verifyPassword(req.user.email, password);
        } catch (err) {
            return res.status(401).json({ success: false, message: 'Invalid admin password' });
        }

        const result = await backupService.restoreBackup(filename);

        // Log the activity
        await activityService.log(null, req.user.sub, 'DATABASE_RESTORE', `Restored database from backup: ${filename}`);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ success: false, message: 'Error restoring backup', error: error.message });
    }
};

/**
 * Delete a backup
 */
const deleteBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const result = backupService.deleteBackup(filename);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting backup:', error);
        res.status(500).json({ success: false, message: 'Error deleting backup', error: error.message });
    }
};

/**
 * Download a backup file
 */
const downloadBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../backups', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Backup file not found' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({ success: false, message: 'Error downloading backup', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserStats,
    updateUserStatus,
    updateUser,
    deleteUser,
    getProjectStats,
    getRequestStats,
    getAllRequests,
    getDashboardAnalytics,
    getAllTags,
    updateTag,
    deleteTag,
    reassignLeaderSupervisor,
    reassignProjectSupervisor,
    demoteStudentLeader,
    getAllActivityLogs,
    getLogActionTypes,
    getPendingSubmissions,
    listBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
    uploadBackup,
    getAllGroups,
    disbandGroup,
    updateGroup
};

/**
 * Upload a backup file manually
 */
async function uploadBackup(req, res) {
    try {
        const { filename: originalName, content: base64Content } = req.body;

        if (!originalName || !base64Content) {
            return res.status(400).json({ success: false, message: 'No file uploaded or content missing' });
        }

        // Determine the filename (ensure .sql extension)
        const filename = originalName.endsWith('.sql') ? originalName : `${originalName}.sql`;

        // Decode base64 to buffer
        const fileBuffer = Buffer.from(base64Content, 'base64');

        // Ensure backups directory exists and write the buffer to disk
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const filePath = path.join(backupDir, filename);
        fs.writeFileSync(filePath, fileBuffer);

        // Log the activity
        await activityService.log(null, req.user.sub, 'DATABASE_BACKUP_UPLOADED', `Uploaded manual database backup: ${filename}`);

        res.status(200).json({
            success: true,
            message: 'Backup uploaded successfully',
            backup: {
                filename,
                size: fileBuffer.length,
                createdAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error uploading backup:', error);
        res.status(500).json({ success: false, message: 'Error uploading backup', error: error.message });
    }
}
