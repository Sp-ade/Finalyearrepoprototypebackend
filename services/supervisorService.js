const supervisorRepository = require('../repositories/supervisorRepository');

class SupervisorService {
    /**
     * Get all students
     */
    async getAllStudents() {
        return await supervisorRepository.getAllStudents();
    }

    /**
     * Set a student's role to leader
     */
    async setStudentLeader(userId, supervisorId) {
        // Verify the user is actually a student
        const user = await supervisorRepository.getUserRole(userId);
        
        if (!user || user.role !== 'student') {
            const error = new Error('Student not found.');
            error.statusCode = 404;
            throw error;
        }

        // Update the role in the Students table and track who assigned it
        const result = await supervisorRepository.updateStudentRole(userId, 'leader', supervisorId);

        if (!result) {
            const error = new Error('Student record not found.');
            error.statusCode = 404;
            throw error;
        }

        return result;
    }

    /**
     * Unassign a student's leader role
     * Only works if the requesting supervisor is the one who assigned it.
     */
    async unassignStudentLeader(userId, supervisorId) {
        const students = await supervisorRepository.getAllStudents();
        const student = students.find(s => s.id === parseInt(userId));

        if (!student) {
            const error = new Error('Student record not found.');
            error.statusCode = 404;
            throw error;
        }

        if (student.role !== 'leader') {
            const error = new Error('Student is not a leader.');
            error.statusCode = 400;
            throw error;
        }

        // Check if the supervisor is the one who assigned it
        if (student.leader_assigned_by !== parseInt(supervisorId)) {
            const error = new Error('You do not have permission to unassign this leader. Only the supervisor who assigned this role can remove it.');
            error.statusCode = 403;
            throw error;
        }

        // Reset to member and clear assignment tracker
        return await supervisorRepository.updateStudentRole(userId, 'member', null);
    }
}

module.exports = new SupervisorService();
