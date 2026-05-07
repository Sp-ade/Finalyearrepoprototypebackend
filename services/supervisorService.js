const supervisorRepository = require('../repositories/supervisorRepository');

class SupervisorService {
    /**
     * Get all students
     */
    async getAllStudents() {
        return await supervisorRepository.getAllStudents();
    }

    /**
     * @deprecated — Use formGroup instead. The group dialog now handles all leader assignment.
     * Kept for backward compatibility with any direct API calls.
     */
    async setStudentLeader(userId, supervisorId) {
        const student = await supervisorRepository.getStudentById(userId);
        if (!student) {
            const error = new Error('Student not found.');
            error.statusCode = 404;
            throw error;
        }
        if (student.leader_assigned_by && student.leader_assigned_by !== parseInt(supervisorId)) {
            const error = new Error(`This student is already assigned as a leader by ${student.supervisor_first_name} ${student.supervisor_last_name}.`);
            error.statusCode = 403;
            throw error;
        }
        const isInProject = await supervisorRepository.checkStudentProjectMembership(userId);
        if (isInProject) {
            const error = new Error('This student is already part of an active project and cannot be assigned as a leader.');
            error.statusCode = 403;
            throw error;
        }
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
        await supervisorRepository.updateStudentRole(userId, 'member', null);

        // Remove pre-project group records (looks up year from DB)
        await supervisorRepository.deleteGroup(userId);

        return { id: userId, role: 'member' };
    }

    /**
     * Form a group with a leader and members
     */
    async formGroup(leaderId, memberIds, groupNumber, year, supervisorId) {
        // 1. Check if leader is already in a project
        const isLeaderInProject = await supervisorRepository.checkStudentProjectMembership(leaderId);
        if (isLeaderInProject) {
            throw new Error('The selected leader is already part of an active project.');
        }

        // 2. Check if any members are already in a project
        if (memberIds && memberIds.length > 0) {
            for (const memberId of memberIds) {
                const isMemberInProject = await supervisorRepository.checkStudentProjectMembership(memberId);
                if (isMemberInProject) {
                    const member = await supervisorRepository.getStudentById(memberId);
                    throw new Error(`Student ${member.first_name} ${member.last_name} is already part of an active project.`);
                }
            }
        }

        // 3. Check group number uniqueness within the same department and year
        const leader = await supervisorRepository.getStudentById(leaderId);
        if (!leader) {
            const error = new Error('Leader student record not found.');
            error.statusCode = 404;
            throw error;
        }
        const leaderDepartment = leader.department;
        if (leaderDepartment) {
            const hasConflict = await supervisorRepository.checkGroupNumberConflict(groupNumber, year, leaderDepartment);
            if (hasConflict) {
                const error = new Error(
                    `Group number ${groupNumber} is already assigned to another group in the ${leaderDepartment} department for ${year}. Please choose a different group number.`
                );
                error.statusCode = 409;
                throw error;
            }
        }

        // 4. Create the group
        await supervisorRepository.createGroup(leaderId, memberIds, groupNumber, year, supervisorId);

        return await supervisorRepository.getStudentById(leaderId);
    }
}

module.exports = new SupervisorService();
