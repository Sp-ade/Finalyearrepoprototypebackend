const requestRepository = require('../repositories/requestRepository');

/**
 * Create a new access request
 */
const createRequest = async (req, res) => {
    try {
        const { studentId, projectId, reason, mode } = req.body;

        // TODO: Validate input
        if (!studentId || !projectId) {
            return res.status(400).json({ message: 'Student ID and Project ID are required' });
        }

        const request = await requestRepository.createRequest(studentId, projectId, reason, mode || 'view');

        res.status(201).json({
            success: true,
            message: 'Request submitted successfully',
            request
        });
    } catch (error) {
        console.error('Error creating request:', error);

        if (error.message === 'You have already requested to join this project.') {
            return res.status(409).json({ message: error.message });
        }

        res.status(500).json({ message: 'Error submitting request', error: error.message });
    }
};

/**
 * Get all requests for a student
 */
const getStudentRequests = async (req, res) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
            return res.status(400).json({ message: 'Student ID is required' });
        }

        const requests = await requestRepository.getRequestsByStudent(studentId);

        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Error fetching student requests:', error);
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};

/**
 * Get all requests for a supervisor
 */
const getSupervisorRequests = async (req, res) => {
    try {
        const { supervisorId } = req.params;

        if (!supervisorId) {
            return res.status(400).json({ message: 'Supervisor ID is required' });
        }

        const requests = await requestRepository.getRequestsBySupervisor(supervisorId);

        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        console.error('Error fetching supervisor requests:', error);
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};

/**
 * Update request status (for supervisor or student editing?)
 * For now, mostly for supervisor, but student might maybe edit reason if pending?
 * Let's assume this is mostly for supervisor actions or status updates.
 */
const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;

        const updatedRequest = await requestRepository.updateRequestStatus(id, status, response);

        if (!updatedRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Request updated',
            request: updatedRequest
        });
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ message: 'Error updating request', error: error.message });
    }
};

/**
 * Delete a request
 */
const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await requestRepository.deleteRequest(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Request deleted'
        });
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ message: 'Error deleting request', error: error.message });
    }
};

module.exports = {
    createRequest,
    getStudentRequests,
    getSupervisorRequests,
    updateRequest,
    deleteRequest
};
