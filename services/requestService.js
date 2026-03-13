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
        return await requestRepository.createRequest(studentId, projectId, reason, mode);
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
