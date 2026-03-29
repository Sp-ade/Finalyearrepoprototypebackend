const adminService = require('../services/adminService');
const activityService = require('../services/activityService');

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

module.exports = {
    getAllUsers,
    getUserStats,
    updateUserStatus,
    getProjectStats,
    getRequestStats,
    getAllRequests,
    getDashboardAnalytics,
    getAllTags,
    updateTag,
    deleteTag,
    reassignLeaderSupervisor,
    reassignProjectSupervisor,
    getAllActivityLogs,
    getLogActionTypes,
    getPendingSubmissions
};
