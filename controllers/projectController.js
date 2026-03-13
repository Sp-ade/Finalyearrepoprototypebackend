const projectService = require('../services/projectService');

/**
 * Create a new project
 */
const createProject = async (req, res) => {
    try {
        const result = await projectService.createProject(req.body);

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
 * Get a single project by ID
 */
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const { studentId } = req.query; // Get studentId from query params

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
        if (req.headers['x-user-role'] === 'admin') {
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

        const responseData = {
            ...project,
            hasAccess,
            isSubmitter,
            editRequestApproved,
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
        const result = await projectService.updateProject(parseInt(id), req.body);

        if (!result.success) {
            return res.status(404).json({
                message: result.message
            });
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
        const result = await projectService.deleteProject(parseInt(id));

        if (!result.success) {
            return res.status(404).json({
                message: result.message
            });
        }

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

module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
};
