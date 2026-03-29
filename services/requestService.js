const requestRepository = require('../repositories/requestRepository');
const activityService = require('../services/activityService');

class RequestService {
    /**
     * Create a new access request
     */
    async createRequest(studentId, projectId, reason, mode = 'view') {
        if (!studentId || !projectId) {
            const error = new Error('Student ID and Project ID are required');
            error.statusCode = 400;
            throw error;
        }
        const request = await requestRepository.createRequest(studentId, projectId, reason, mode);

        // Audit Logging
        await activityService.log(projectId, studentId, 'ACCESS_REQUESTED', `Student requested ${mode} access`);

        // Notify supervisor
        try {
            const projectRepository = require('../repositories/projectRepository');
            const project = await projectRepository.getProjectById(projectId);
            if (project && project.supervisor_id) {
                const notificationService = require('./notificationService');
                const title = 'New Access Request';
                const message = `A student has submitted a new ${mode} request for the project "${project.title}".`;
                notificationService.createNotification(project.supervisor_id, title, message, 'new_request', null, request.request_id, 'request')
                    .catch(err => console.error('Error emitting request notification:', err));
            }
        } catch (err) {
            console.error('Notification service integration error:', err);
        }

        return request;
    }

    /**
     * Get all requests for a student
     */
    async getStudentRequests(studentId) {
        if (!studentId) {
            const error = new Error('Student ID is required');
            error.statusCode = 400;
            throw error;
        }
        return await requestRepository.getRequestsByStudent(studentId);
    }

    /**
     * Get all requests for a supervisor
     */
    async getSupervisorRequests(supervisorId) {
        if (!supervisorId) {
            const error = new Error('Supervisor ID is required');
            error.statusCode = 400;
            throw error;
        }
        return await requestRepository.getRequestsBySupervisor(supervisorId);
    }

    /**
     * Update a request's status
     */
    async updateRequest(requestId, status, response, approverId, approverRole) {
        // Authorization Check: Admin or assigned Supervisor only
        const request = await requestRepository.getRequestById(requestId);
        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }

        const projectRepository = require('../repositories/projectRepository');
        const project = await projectRepository.getProjectById(request.project_id);
        
        if (approverRole !== 'admin' && project.supervisor_id !== approverId) {
            const error = new Error('Unauthorized: Only the assigned supervisor or an admin can review this request.');
            error.statusCode = 403;
            throw error;
        }

        const updated = await requestRepository.updateRequestStatus(requestId, status, response);
        if (!updated) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }

        // Trigger notification to the student asynchronously
        try {
            const notificationService = require('./notificationService');
            
            let title = 'Access Request Updated';
            let message = `Your access request has been officially ${status.toLowerCase()}.`;
            if (response) {
                message += ` Supervisor note: "${response}"`;
            }

            // Call createNotification asynchronously so we don't block the API response
            notificationService.createNotification(
                updated.student_id,
                title,
                message,
                'request_status_change',
                null,
                updated.request_id,
                'request'
            ).catch(err => console.error('Error emitting request notification:', err));
        } catch (err) {
            console.error('Notification service integration error:', err);
        }

        // Audit Logging
        if (approverId && updated.project_id) {
            const actor = approverRole === 'admin' ? 'Admin' : 'Supervisor';
            await activityService.log(updated.project_id, approverId, 'ACCESS_REVIEWED', `${actor} ${status.toLowerCase()} student ${updated.mode} access`);
        }

        return updated;
    }

    /**
     * Delete a request
     */
    async deleteRequest(requestId) {
        const deleted = await requestRepository.deleteRequest(requestId);
        if (!deleted) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }
        return deleted;
    }

    /**
     * Delete / Reset a request for a student and project.
     * Used to clear the approved status after a successful edit.
     */
    async resetRequest(studentId, projectId, mode = 'edit') {
        await requestRepository.deleteByProjectAndStudent(studentId, projectId, mode);
        return { success: true };
    }
}

module.exports = new RequestService();
