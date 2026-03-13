const requestService = require('../services/requestService');

/**
 * Create a new access request
 */
const createRequest = async (req, res) => {
    try {
        const { studentId, projectId, reason, mode } = req.body;
        const request = await requestService.createRequest(studentId, projectId, reason, mode || 'view');
        res.status(201).json({ success: true, message: 'Request submitted successfully', request });
    } catch (error) {
        console.error('Error creating request:', error);
        const status = error.statusCode || (error.message.includes('already submitted') ? 409 : 500);
        res.status(status).json({ message: error.message || 'Error submitting request' });
    }
};

/**
 * Get all requests for a student
 */
const getStudentRequests = async (req, res) => {
    try {
        const { studentId } = req.params;
        const requests = await requestService.getStudentRequests(studentId);
        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching student requests:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Error fetching requests' });
    }
};

/**
 * Get all requests for a supervisor
 */
const getSupervisorRequests = async (req, res) => {
    try {
        const { supervisorId } = req.params;
        const requests = await requestService.getSupervisorRequests(supervisorId);
        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching supervisor requests:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Error fetching requests' });
    }
};

/**
 * Update request status
 */
const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;
        const request = await requestService.updateRequest(id, status, response);
        res.status(200).json({ success: true, message: 'Request updated', request });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Error updating request' });
    }
};

/**
 * Delete a request
 */
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await requestService.deleteRequest(id);
        res.status(200).json({ success: true, message: 'Request deleted' });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(error.statusCode || 500).json({ message: error.message || 'Error deleting request' });
    }
};

module.exports = {
    createRequest,
    getStudentRequests,
    getSupervisorRequests,
    updateRequest,
    deleteRequest
};
