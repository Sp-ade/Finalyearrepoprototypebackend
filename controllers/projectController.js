const projectService = require('../services/projectService');
const staffPermissionService = require('../services/staffPermissionService');
const requestService = require('../services/requestService');
const activityService = require('../services/activityService');
const projectRepository = require('../repositories/projectRepository');

/**
 * Create a new project
 */
const createProject = async (req, res) => {
    try {
        const projectData = { ...req.body };

        // IDOR Fix: If supervisor is creating, force their ID from session
        if (req.user?.role === 'supervisor') {
            projectData.supervisorId = req.user.sub;
        }

        const result = await projectService.createProject(projectData);

        if (result.project) {
            await activityService.logProjectCreated(result.project.project_id, req.user.sub, result.project.title);
        }

        res.status(201).json({
            project: result.project
        });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating project',
            error: error.message
        });
    }
};

/**
 * Get all projects
 */
const getAllProjects = async (req, res) => {
    try {
        const result = await projectService.getAllProjects();

        res.status(200).json({
            projects: result.projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: error.message
        });
    }
};

/**
 * Get all tags
 */
const getAllTags = async (req, res) => {
    try {
        const tags = await projectRepository.getAllTags();
        res.status(200).json({
            success: true,
            tags
        });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tags',
            error: error.message
        });
    }
};

/**
 * Get a single project by ID with access control
 */
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await projectService.getProjectWithAccess(parseInt(id), req.user);

        if (!result.success) {
            return res.status(404).json({
                message: result.message
            });
        }

        res.status(200).json(result.project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching project',
            error: error.message
        });
    }
};

/**
 * Update a project
 */
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id);

        // 1. Ownership/Permission check
        const projectRes = await projectService.getProjectById(projectId);
        if (!projectRes.success) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const project = projectRes.project;
        const isOwner = project.supervisor_id && req.user?.sub && String(project.supervisor_id) === String(req.user.sub);

        if (req.user?.role !== 'admin') {
            if (isOwner) {
                // Supervisor owns the project — must also have an Approved Staff_Permission
                const hasPermission = await staffPermissionService.hasApprovedPermission(req.user.sub, projectId);
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: 'Edit permission required. Please request admin approval before editing this project.'
                    });
                }
            } else {
                // Not the owner — check if they are a student leader with an approved edit request
                const studentId = req.user?.sub;
                if (!studentId) {
                    return res.status(401).json({ message: 'Authentication required' });
                }

                const editRequestApproved = await projectRepository.checkApprovedEditRequest(projectId, studentId);
                const hasEditableSubmission = await projectRepository.hasEditableSubmission(projectId, studentId);

                if (!editRequestApproved && !hasEditableSubmission) {
                    return res.status(403).json({ message: 'Unauthorized to update this project' });
                }
            }
        }

        // 2. Perform Update
        const result = await projectService.updateProject(projectId, req.body);

        // 3. Security: Reset permissions after successful update
        if (req.user?.role === 'supervisor') {
            await staffPermissionService.resetPermission(req.user.sub, projectId, 'edit');
        } else if (req.user?.role === 'student' && result.project) {
            await requestService.resetRequest(req.user.sub, projectId, 'edit');
        }

        // 4. Audit Logging
        if (result.project) {
            await activityService.logProjectUpdated(projectId, req.user.sub);
        }

        res.status(200).json({
            project: result.project
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating project',
            error: error.message
        });
    }
};

/**
 * Delete a project
 */
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const projectId = parseInt(id);

        // Verify ownership/admin before delete
        const projectRes = await projectService.getProjectById(projectId);
        if (!projectRes.success) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isOwner = projectRes.project.supervisor_id && req.user?.sub && String(projectRes.project.supervisor_id) === String(req.user.sub);

        if (req.user?.role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'Unauthorized to delete this project' });
        }

        const result = await projectService.deleteProject(projectId);

        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting project',
            error: error.message
        });
    }
};

/**
 * Reassign the supervisor for a project (Admin only)
 */
const reassignSupervisor = async (req, res) => {
    try {
        const { id } = req.params;
        const { newSupervisorId } = req.body;
        const projectId = parseInt(id);

        if (!newSupervisorId) {
            return res.status(400).json({ message: 'New supervisor ID is required' });
        }

        // Only admins can reassign supervisors
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can reassign supervisors' });
        }

        const result = await projectService.reassignSupervisor(projectId, parseInt(newSupervisorId));

        if (!result.success) {
            return res.status(404).json({ message: result.message });
        }

        // Audit Logging
        if (result.project) {
            await activityService.logSupervisorReassigned(projectId, req.user.sub, "Previous Supervisor", result.project.supervisor_name);
        }

        res.status(200).json({
            success: true,
            message: 'Supervisor reassigned successfully',
            project: result.project
        });
    } catch (error) {
        console.error('Error reassigning supervisor:', error);
        res.status(500).json({
            success: false,
            message: 'Error reassigning supervisor',
            error: error.message
        });
    }
};

/**
 * Get activity history for a project (Admin Only)
 */
const getProjectHistory = async (req, res) => {
    try {
        const { id } = req.params;

        // Security: Only admins can view the history tab
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can view project activity history'
            });
        }

        const history = await activityService.getProjectHistory(parseInt(id));
        res.status(200).json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Error fetching project history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching project history',
            error: error.message
        });
    }
};

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getAllTags,
    reassignSupervisor,
    getProjectHistory
};
