const supervisorService = require('../services/supervisorService');

// Get all students with their matric numbers
exports.getAllStudents = async (req, res) => {
    try {
        const students = await supervisorService.getAllStudents();
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};

// Set a student's role to leader
exports.setStudentLeader = async (req, res) => {
    try {
        const { userId } = req.params;
        // IDOR Fix: Use supervisor ID from JWT instead of req.body
        const supervisorId = req.user.sub;
        const result = await supervisorService.setStudentLeader(userId, supervisorId);
        res.json({ message: 'Student successfully set as leader', student: result });
    } catch (error) {
        console.error('Error setting student as leader:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};

// Unassign a student's leader role
exports.unassignStudentLeader = async (req, res) => {
    try {
        const { userId } = req.params;
        // IDOR Fix: Use supervisor ID from JWT instead of req.body
        const supervisorId = req.user.sub;
        const result = await supervisorService.unassignStudentLeader(userId, supervisorId);
        res.json({ message: 'Student leader role removed', student: result });
    } catch (error) {
        console.error('Error unassigning student leader:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};

// Form a group with leader and members
exports.formGroup = async (req, res) => {
    try {
        const { leaderId, memberIds, groupNumber, year } = req.body;
        const supervisorId = req.user.sub;
        
        if (!leaderId || !groupNumber || !year) {
            return res.status(400).json({ error: 'Leader ID, Group Number, and Year are required.' });
        }

        const result = await supervisorService.formGroup(leaderId, memberIds, groupNumber, year, supervisorId);
        res.json({ message: 'Group successfully formed', student: result });
    } catch (error) {
        console.error('Error forming group:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};

// Update an existing group
exports.updateGroup = async (req, res) => {
    try {
        const { groupNumber, year } = req.params;
        const { leaderId, memberIds } = req.body;
        const supervisorId = req.user.sub;

        if (!leaderId) {
            return res.status(400).json({ error: 'Leader ID is required.' });
        }

        const result = await supervisorService.updateGroup(
            parseInt(groupNumber),
            parseInt(year),
            leaderId,
            memberIds,
            supervisorId
        );
        res.json(result);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
};
