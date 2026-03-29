const staffPermissionRepo = require('../repositories/staffPermissionRepository');
const activityService = require('../services/activityService');

class StaffPermissionService {
    /**
     * Supervisor requests edit permission for a project.
     * Resets to Pending if previously rejected.
     */
    async requestPermission(supervisorId, projectId, reason, type = 'edit') {
        const perm = await staffPermissionRepo.create(supervisorId, projectId, reason, type);
        
        // Audit Logging
        await activityService.log(projectId, supervisorId, 'PERMISSION_REQUESTED', `Supervisor requested ${type} permission`);
        
        return { success: true, permission: perm };
    }

    /**
     * Check if a supervisor has an approved permission for a project.
     */
    async hasApprovedPermission(supervisorId, projectId, type = 'edit') {
        const perm = await staffPermissionRepo.getByProjectAndSupervisor(supervisorId, projectId, type);
        return perm && perm.status === 'Approved';
    }

    /**
     * Get the permission record for a supervisor + project (for frontend status display).
     */
    async getPermission(supervisorId, projectId, type = 'edit') {
        const perm = await staffPermissionRepo.getByProjectAndSupervisor(supervisorId, projectId, type);
        return { success: true, permission: perm || null };
    }

    /**
     * Supervisor's own request history.
     */
    async getMine(supervisorId) {
        const perms = await staffPermissionRepo.getBySupervisor(supervisorId);
        return { success: true, permissions: perms };
    }

    /**
     * Admin: list all permissions, optionally filtered by status.
     */
    async getAll(status = null) {
        const perms = await staffPermissionRepo.getAll(status);
        return { success: true, permissions: perms };
    }

    /**
     * Admin: approve or reject a permission request.
     */
    async review(permissionId, status, adminId) {
        if (!['Approved', 'Rejected'].includes(status)) {
            return { success: false, message: 'Status must be Approved or Rejected' };
        }
        const perm = await staffPermissionRepo.updateStatus(permissionId, status);
        if (!perm) return { success: false, message: 'Permission not found' };

        // Audit Logging
        if (adminId && perm.project_id) {
            await activityService.logPermissionReviewed(perm.project_id, adminId, perm.type, status);
        }

        return { success: true, permission: perm };
    }

    /**
     * Delete / Reset a permission for a supervisor and project.
     * Used to clear the approved status after a successful edit/delete.
     */
    async resetPermission(supervisorId, projectId, type = 'edit') {
        await staffPermissionRepo.deleteByProjectAndSupervisor(supervisorId, projectId, type);
        return { success: true };
    }
}

module.exports = new StaffPermissionService();
