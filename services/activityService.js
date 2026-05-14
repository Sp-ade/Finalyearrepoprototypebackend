const activityRepository = require('../repositories/activityRepository');

class ActivityService {
    /**
     * Log an activity
     */
    async log(projectId, userId, actionType, description) {
        if (!userId) return null;
        return await activityRepository.createLog(projectId, userId, actionType, description);
    }

    /**
     * Get history for a project (Admin Only check handled in controller)
     */
    async getProjectHistory(projectId) {
        return await activityRepository.getLogsByProject(projectId);
    }

    /**
     * Helpers for common log messages
     */
    async logProjectCreated(projectId, userId, projectTitle) {
        return await this.log(projectId, userId, 'PROJECT_CREATED', `Project "${projectTitle}" created`);
    }

    async logProjectUpdated(projectId, userId) {
        return await this.log(projectId, userId, 'PROJECT_UPDATED', `Project details updated`);
    }

    async logSupervisorReassigned(projectId, userId, oldName, newName) {
        return await this.log(projectId, userId, 'SUPERVISOR_REASSIGNED', `Supervisor reassigned from ${oldName} to ${newName}`);
    }

    async logPermissionReviewed(projectId, userId, type, status) {
        const action = type === 'edit' ? 'Edit' : 'Delete';
        return await this.log(projectId, userId, 'PERMISSION_REVIEWED', `Staff ${action} permission ${status.toLowerCase()}`);
    }

    async logStorageCleanup(userId, stats) {
        return await this.log(null, userId, 'STORAGE_CLEANUP', `Cleaned up ${stats.deletedCount} unused storage files.`);
    }

    async logUserLogin(userId, email) {
        return await this.log(null, userId, 'USER_LOGIN', `User ${email} logged in`);
    }

    async logUserLogout(userId, email) {
        return await this.log(null, userId, 'USER_LOGOUT', `User ${email} logged out`);
    }

    async logUserSignup(userId, email) {
        return await this.log(null, userId, 'USER_SIGNUP', `User ${email} created an account`);
    }

    async logPasswordResetRequest(userId, email) {
        return await this.log(null, userId, 'PASSWORD_RESET_REQ', `Password reset requested for ${email}`);
    }

    async logPasswordResetSuccess(userId, email) {
        return await this.log(null, userId, 'PASSWORD_RESET_SUCCESS', `Password successfully reset for ${email}`);
    }
}


module.exports = new ActivityService();
