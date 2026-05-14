const db = require('../Database');
const adminRepository = require('../repositories/adminRepository');
const supervisorRepository = require('../repositories/supervisorRepository');
const activityRepository = require('../repositories/activityRepository');
const projectRepository = require('../repositories/projectRepository');
const submissionRepository = require('../repositories/submissionRepository');
const userRepository = require('../repositories/userRepository');
const notificationService = require('./notificationService');

class AdminService {
    /**
     * Get all users with optional filtering
     */
    async getAllUsers(filters = {}) {
        const users = await adminRepository.getAllUsers(filters);
        const total = await adminRepository.getUserCount(filters);

        return {
            success: true,
            users,
            total,
            limit: filters.limit || 100,
            offset: filters.offset || 0
        };
    }

    /**
     * Get user statistics
     */
    async getUserStats() {
        const stats = await adminRepository.getUserStats();
        return {
            success: true,
            stats
        };
    }

    /**
     * Update user status (activate/deactivate)
     */
    async updateUserStatus(userId, isActive) {
        const user = await adminRepository.updateUserStatus(userId, isActive);

        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        return {
            success: true,
            user
        };
    }

    /**
     * Get project statistics
     */
    async getProjectStats() {
        const stats = await adminRepository.getProjectStats();
        const byCategory = await adminRepository.getProjectsByCategory();

        return {
            success: true,
            stats: {
                ...stats,
                by_category: byCategory
            }
        };
    }

    /**
     * Get request statistics
     */
    async getRequestStats() {
        const stats = await adminRepository.getRequestStats();
        return {
            success: true,
            stats
        };
    }

    /**
     * Get all requests with filtering
     */
    async getAllRequests(filters = {}) {
        const requests = await adminRepository.getAllRequests(filters);
        return {
            success: true,
            requests
        };
    }

    /**
     * Get dashboard analytics
     */
    async getDashboardAnalytics() {
        const [userStats, projectStats, requestStats] = await Promise.all([
            this.getUserStats(),
            this.getProjectStats(),
            this.getRequestStats()
        ]);

        // Get recent activity (last 10 actions)
        const activityResult = await activityRepository.getGlobalRecentActivity(10);

        return {
            success: true,
            analytics: {
                users: userStats.stats,
                projects: projectStats.stats,
                requests: requestStats.stats,
                recent_activity: activityResult
            }
        };
    }

    /**
     * Get all activity logs with pagination and filters
     */
    async getAllActivityLogs(filters = {}) {
        const { limit = 50, offset = 0 } = filters;
        const result = await activityRepository.getPaginatedLogs(limit, offset, filters);
        
        return {
            success: true,
            ...result,
            limit,
            offset
        };
    }

    /**
     * Get distinct action types for frontend filters
     */
    async getLogActionTypes() {
        const types = await activityRepository.getDistinctActionTypes();
        return {
            success: true,
            actions: types
        };
    }

    /**
     * Get all tags with usage count
     */
    async getAllTags() {
        const tags = await adminRepository.getAllTagsWithUsage();
        return {
            success: true,
            tags
        };
    }

    /**
     * Update tag name
     */
    async updateTag(tagId, newName) {
        const tag = await adminRepository.updateTag(tagId, newName);

        if (!tag) {
            return {
                success: false,
                message: 'Tag not found'
            };
        }

        return {
            success: true,
            tag
        };
    }

    /**
     * Delete tag
     */
    async deleteTag(tagId) {
        const tag = await adminRepository.deleteTag(tagId);

        if (!tag) {
            return {
                success: false,
                message: 'Tag not found'
            };
        }

        return {
            success: true,
            message: 'Tag deleted successfully'
        };
    }

    /**
     * Reassign the supervisor for a student leader (admin only).
     */
    async reassignLeaderSupervisor(studentUserId, newSupervisorId) {
        // 1. Validate the student exists and is a leader
        const student = await supervisorRepository.getStudentById(studentUserId);

        if (!student) {
            return { success: false, message: 'Student not found' };
        }

        if (student.role !== 'leader') {
            return { success: false, message: 'Student is not currently assigned as a leader' };
        }

        // 2. Validate the new supervisor
        const newSupervisor = await supervisorRepository.getUserRole(newSupervisorId);
        if (!newSupervisor || newSupervisor.role !== 'supervisor') {
            return { success: false, message: 'New supervisor not found or user is not a supervisor' };
        }

        // 3. Perform the reassignment
        const updated = await supervisorRepository.reassignLeaderSupervisor(studentUserId, newSupervisorId);

        if (!updated) {
            return { success: false, message: 'Failed to reassign supervisor' };
        }

        // 4. Notify both old and new supervisor
        const studentName = `${student.first_name} ${student.last_name}`;
        const oldSupervisorId = student.leader_assigned_by;

        if (oldSupervisorId && oldSupervisorId !== newSupervisorId) {
            notificationService.createNotification(
                oldSupervisorId,
                'Group Supervision Removed',
                `You have been removed as the supervisor for student leader ${studentName} (${student.student_matric_no}) by an administrator.`,
                'supervisor_removed'
            ).catch(err => console.error('Failed to send old supervisor removal notification:', err));
        }

        notificationService.createNotification(
            newSupervisorId,
            'Group Supervision Assigned',
            `You have been assigned as the supervisor for student leader ${studentName} (${student.student_matric_no}) by an administrator.`,
            'supervisor_assigned'
        ).catch(err => console.error('Failed to send supervisor reassignment notification:', err));

        return {
            success: true,
            message: 'Supervisor successfully reassigned for student leader',
            student: updated
        };
    }

    /**
     * Demote a student leader back to a regular student (admin only).
     */
    async demoteStudentLeader(studentUserId) {
        const student = await supervisorRepository.getStudentById(studentUserId);

        if (!student) {
            return { success: false, message: 'Student not found' };
        }

        if (student.role !== 'leader') {
            return { success: false, message: 'Student is not currently a leader' };
        }

        const demoted = await adminRepository.demoteStudentLeader(studentUserId);

        if (!demoted) {
            return { success: false, message: 'Failed to demote student' };
        }

        return {
            success: true,
            message: 'Student successfully demoted from leadership role',
            student: demoted
        };
    }

    /**
     * Reassign the supervisor for a project (admin only).
     */
    async reassignProjectSupervisor(projectId, newSupervisorId) {
        const project = await projectRepository.getProjectById(projectId);

        if (!project) {
            return { success: false, message: 'Project not found' };
        }

        const newSupervisor = await supervisorRepository.getUserRole(newSupervisorId);
        if (!newSupervisor || newSupervisor.role !== 'supervisor') {
            return { success: false, message: 'New supervisor not found or user is not a supervisor' };
        }

        const updated = await projectRepository.reassignProjectSupervisor(projectId, newSupervisorId);

        if (!updated) {
            return { success: false, message: 'Failed to reassign supervisor to project' };
        }

        // Notify both old and new supervisor
        const oldSupervisorId = project.supervisor_id;

        if (oldSupervisorId && oldSupervisorId !== newSupervisorId) {
            notificationService.createNotification(
                oldSupervisorId,
                'Project Supervision Removed',
                `You have been removed as the supervisor for project "${project.title}" by an administrator.`,
                'supervisor_removed',
                null,
                projectId,
                'project'
            ).catch(err => console.error('Failed to send old supervisor project removal notification:', err));
        }

        notificationService.createNotification(
            newSupervisorId,
            'Project Supervision Assigned',
            `You have been assigned as the supervisor for project "${project.title}" by an administrator.`,
            'supervisor_assigned',
            null,
            projectId,
            'project'
        ).catch(err => console.error('Failed to send project supervisor notification:', err));

        return {
            success: true,
            message: 'Project successfully reassigned to new supervisor',
            project: updated
        };
    }

    /**
     * Get all pending project submissions across the system
     */
    async getPendingSubmissions() {
        const submissions = await submissionRepository.getAll(null);
        return {
            success: true,
            submissions: submissions.filter(s => s.status === 'Pending')
        };
    }

    /**
     * Permanently delete a user and all their associated profile data
     */
    async deleteUser(userId) {
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const checkRes = await client.query('SELECT id, email FROM Users WHERE id = $1', [userId]);
            if (checkRes.rows.length === 0) {
                return { success: false, message: 'User not found' };
            }
            const user = checkRes.rows[0];

            // Explicit cleanup for linked items (others handled by CASCADE)
            await client.query('UPDATE Project_Artifacts SET uploaded_by = NULL WHERE uploaded_by = $1', [userId]);
            await client.query('UPDATE Projects SET supervisor_id = NULL WHERE supervisor_id = $1', [userId]);
            await client.query('DELETE FROM Users WHERE id = $1', [userId]);

            await client.query('COMMIT');
            
            return {
                success: true,
                message: `User ${user.email} deleted successfully`,
                deletedId: userId
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    /**
     * Get all groups from Project_Members (for admin view)
     */
    async getAllGroups() {
        const students = await supervisorRepository.getAllStudents();
        return { success: true, students };
    }

    /**
     * Disband a group (admin only)
     */
    async disbandGroup(groupNumber, year) {
        const result = await adminRepository.disbandGroup(groupNumber, year);

        if (result.disbandedCount === 0) {
            return { success: false, message: 'Group not found or already disbanded.' };
        }

        return {
            success: true,
            message: `Group ${groupNumber} (${year}) disbanded. ${result.disbandedCount} student(s) reset to member.`,
            disbandedCount: result.disbandedCount
        };
    }

    /**
     * Admin Override: Update an existing group and potentially reassign its supervisor.
     */
    async updateGroup(groupNumber, year, leaderId, memberIds, newSupervisorId) {
        // 1. Validate new supervisor exists
        const supervisor = await userRepository.findById(newSupervisorId);
        if (!supervisor || supervisor.role !== 'supervisor') {
            throw new Error('Assigned supervisor not found or is not a supervisor.');
        }

        // 2. Capture the old supervisor before the update
        const currentLeader = await supervisorRepository.getStudentById(leaderId);
        const oldSupervisorId = currentLeader ? currentLeader.leader_assigned_by : null;

        // 3. Perform the update via adminRepository
        await adminRepository.adminUpdateGroup(groupNumber, year, leaderId, memberIds, newSupervisorId);

        // 4. Notify both old and new supervisor
        const parsedNewId = parseInt(newSupervisorId);

        if (oldSupervisorId && oldSupervisorId !== parsedNewId) {
            notificationService.createNotification(
                oldSupervisorId,
                'Group Supervision Removed',
                `You have been removed as the supervisor for Group ${groupNumber} (${year}) by an administrator.`,
                'supervisor_removed'
            ).catch(err => console.error('Failed to send old group supervisor removal notification:', err));
        }

        notificationService.createNotification(
            parsedNewId,
            'Group Supervision Assigned',
            `You have been assigned as the supervisor for Group ${groupNumber} (${year}) by an administrator.`,
            'supervisor_assigned'
        ).catch(err => console.error('Failed to send group supervisor notification:', err));

        return { 
            success: true, 
            message: `Group ${groupNumber} (${year}) successfully updated by Admin.` 
        };
    }

    /**
     * Update user details (Admin override)
     */
    async updateUser(userId, userData) {
        // 1. Fetch user to confirm existence and get current role
        const user = await userRepository.findById(userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }

        // 2. Add role to data for repository logic
        const updateData = { ...userData, role: user.role };

        // 3. Call repository to perform update
        await userRepository.updateUserDetails(userId, updateData);

        return {
            success: true,
            message: 'User details updated successfully'
        };
    }
}

module.exports = new AdminService();
