const staffPermissionService = require('../services/staffPermissionService');

/**
 * POST /api/staff-permissions
 * Supervisor submits an edit-permission request for a project.
 */
const requestPermission = async (req, res) => {
    try {
        const supervisorId = req.user?.sub;
        if (!supervisorId) return res.status(401).json({ success: false, message: 'Authentication required' });

        if (req.user?.role !== 'supervisor') {
            return res.status(403).json({ success: false, message: 'Only supervisors can request edit permissions' });
        }

        const { projectId, reason, type } = req.body;
        if (!projectId) return res.status(400).json({ success: false, message: 'projectId is required' });

        const result = await staffPermissionService.requestPermission(
            supervisorId, 
            parseInt(projectId), 
            reason || '', 
            type || 'edit'
        );
        res.status(201).json(result);
    } catch (error) {
        console.error('Error requesting permission:', error);
        res.status(500).json({ success: false, message: 'Error submitting request', error: error.message });
    }
};

/**
 * GET /api/staff-permissions/mine
 * Supervisor fetches their own request history.
 */
const getMyPermissions = async (req, res) => {
    try {
        const supervisorId = req.user?.sub;
        if (!supervisorId) return res.status(401).json({ success: false, message: 'Authentication required' });

        const result = await staffPermissionService.getMine(supervisorId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ success: false, message: 'Error fetching permissions', error: error.message });
    }
};

/**
 * GET /api/staff-permissions/project/:projectId
 * Supervisor checks their permission status for a specific project.
 */
const getPermissionForProject = async (req, res) => {
    try {
        const supervisorId = req.user?.sub;
        if (!supervisorId) return res.status(401).json({ success: false, message: 'Authentication required' });

        const { projectId } = req.params;
        const { type } = req.query;
        const result = await staffPermissionService.getPermission(supervisorId, parseInt(projectId), type || 'edit');
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching permission:', error);
        res.status(500).json({ success: false, message: 'Error fetching permission', error: error.message });
    }
};

/**
 * GET /api/admin/staff-permissions
 * Admin: list all permissions, filter by ?status=Pending|Approved|Rejected
 */
const getAllPermissions = async (req, res) => {
    try {
        const { status } = req.query;
        const result = await staffPermissionService.getAll(status || null);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching all permissions:', error);
        res.status(500).json({ success: false, message: 'Error fetching permissions', error: error.message });
    }
};

/**
 * PUT /api/admin/staff-permissions/:id
 * Admin: approve or reject a request.
 */
const reviewPermission = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const adminId = req.user.sub;

        if (!status) return res.status(400).json({ success: false, message: 'status is required' });

        const result = await staffPermissionService.review(parseInt(id), status, adminId);
        if (!result.success) return res.status(400).json(result);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error reviewing permission:', error);
        res.status(500).json({ success: false, message: 'Error reviewing permission', error: error.message });
    }
};

module.exports = {
    requestPermission,
    getMyPermissions,
    getPermissionForProject,
    getAllPermissions,
    reviewPermission
};
