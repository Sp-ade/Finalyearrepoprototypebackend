const requestRepository = require('../repositories/requestRepository');

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
    async updateRequest(requestId, status, response) {
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
}

module.exports = new RequestService();
