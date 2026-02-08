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

        let hasAccess = false;

        // If studentId is provided, check access
        if (studentId) {
            hasAccess = await requestRepository.checkAccess(studentId, parseInt(id));
        }

        // Return project with hasAccess flag
        // We might want to filter artifacts if not hasAccess, but for now we'll just send the flag
        // and let frontend handle visibility, or we can filter here.
        // The user requirement implies "student can view the pdf since he has access".
        // Let's send the flag.

        const responseData = {
            ...result.project,
            hasAccess
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
