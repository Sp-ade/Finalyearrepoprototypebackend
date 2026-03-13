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
    async setStudentLeader(userId) {
        // Verify the user is actually a student
        const user = await supervisorRepository.getUserRole(userId);
        
        if (!user || user.role !== 'student') {
            const error = new Error('Student not found.');
            error.statusCode = 404;
            throw error;
        }

        // Update the role in the Students table
        const result = await supervisorRepository.updateStudentRole(userId, 'leader');

        if (!result) {
            const error = new Error('Student record not found.');
            error.statusCode = 404;
            throw error;
        }

        return result;
    }
}

module.exports = new SupervisorService();
