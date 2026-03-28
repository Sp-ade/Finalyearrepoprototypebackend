const projectService = require('../services/projectService');
const staffPermissionService = require('../services/staffPermissionService');

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

const requestRepository = require('../repositories/requestRepository');
const db = require('../Database');

/**
 * Get all tags
 */
const getAllTags = async (req, res) => {
    try {
        const result = await db.query('SELECT name FROM Tags ORDER BY name ASC');
        res.status(200).json({
            success: true,
            tags: result.rows.map(row => row.name)
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
 * Get a single project by ID
 */
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        // IDOR Fix: Use student ID from JWT sub instead of query params
        const studentId = req.user?.sub;

        const result = await projectService.getProjectById(parseInt(id));

        if (!result.success) {
            return res.status(404).json({
                message: result.message
            });
        }

        const project = result.project;
        let hasAccess = false;
        let isSubmitter = false;
        let editRequestApproved = false;
        let submissionId = null;

        // Automatically grant access to admins
        if (req.user?.role === 'admin') {
            hasAccess = true;
        }

        // If studentId is provided, check access
        if (studentId && !hasAccess) {
            // 1. Check if student is the submitter
            const submissionRes = await db.query(
                'SELECT submission_id FROM Project_Submissions WHERE project_id = $1 AND student_id = $2',
                [id, studentId]
            );

            if (submissionRes.rows.length > 0) {
                hasAccess = true;
                isSubmitter = true;
                submissionId = submissionRes.rows[0].submission_id;

                // Check for approved edit request if they are the submitter
                const editRequestRes = await db.query(
                    "SELECT 1 FROM Access_Requests_Student WHERE project_id = $1 AND student_id = $2 AND mode = 'edit' AND status = 'Approved'",
                    [id, studentId]
                );
                if (editRequestRes.rows.length > 0) {
                    editRequestApproved = true;
                }
            } else {
                // 2. Check if student is a participant (name match in Studentsnames)
                const userRes = await db.query('SELECT first_name, last_name FROM Users WHERE id = $1', [studentId]);
                if (userRes.rows.length > 0) {
                    const fullName = `${userRes.rows[0].first_name} ${userRes.rows[0].last_name}`.toLowerCase();
                    const participants = project.Studentnames || [];
                    if (participants.some(name => name.toLowerCase() === fullName)) {
                        hasAccess = true;
                    }
                }
            }

            // 3. Fallback to existing manual access request check
            if (!hasAccess) {
                hasAccess = await requestRepository.checkAccess(studentId, parseInt(id));
            }
        }

        const isSupervisor = req.user ? (project.supervisor_id === req.user.sub || String(project.supervisor_id) === String(req.user.sub)) : false;

        // Check if supervisor has an approved Staff_Permission to edit this project
        let supervisorEditApproved = false;
        if (isSupervisor) {
            supervisorEditApproved = await staffPermissionService.hasApprovedPermission(req.user.sub, parseInt(id));
        }

        // Admin always has edit access
        if (req.user?.role === 'admin') {
            supervisorEditApproved = true;
        }

        const responseData = {
            ...project,
            hasAccess,
            isSupervisor,
            isSubmitter,
            editRequestApproved,
            supervisorEditApproved,
            submissionId
        };

        res.status(200).json(responseData);
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

        // IDOR Fix: Verify ownership/admin before update
        const projectRes = await projectService.getProjectById(parseInt(id));
        if (!projectRes.success) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isOwner = projectRes.project.supervisor_id && req.user?.sub && String(projectRes.project.supervisor_id) === String(req.user.sub);

        if (req.user?.role !== 'admin') {
            if (isOwner) {
                // Supervisor owns the project — must also have an Approved Staff_Permission
                const hasPermission = await staffPermissionService.hasApprovedPermission(req.user.sub, parseInt(id));
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

                const editRequestRes = await db.query(
                    "SELECT 1 FROM Access_Requests_Student WHERE project_id = $1 AND student_id = $2 AND mode = 'edit' AND status = 'Approved'",
                    [id, studentId]
                );

                if (editRequestRes.rows.length === 0) {
                    return res.status(403).json({ message: 'Unauthorized to update this project' });
                }
            }
        }

        const result = await projectService.updateProject(parseInt(id), req.body);

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

        // IDOR Fix: Verify ownership/admin before delete
        const projectRes = await projectService.getProjectById(parseInt(id));
        if (!projectRes.success) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const isOwner = projectRes.project.supervisor_id && req.user?.sub && String(projectRes.project.supervisor_id) === String(req.user.sub);

        if (req.user?.role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: 'Unauthorized to delete this project' });
        }

        const result = await projectService.deleteProject(parseInt(id));

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

        if (!newSupervisorId) {
            return res.status(400).json({ message: 'New supervisor ID is required' });
        }

        // Only admins can reassign supervisors
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can reassign supervisors' });
        }

        const result = await projectService.reassignSupervisor(parseInt(id), parseInt(newSupervisorId));

        if (!result.success) {
            return res.status(404).json({ message: result.message });
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

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getAllTags,
    reassignSupervisor
};
