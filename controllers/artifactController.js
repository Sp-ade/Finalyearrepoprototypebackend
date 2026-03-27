const artifactService = require('../services/artifactService');

/**
 * Upload project artifact
 */
const uploadProjectArtifact = async (req, res) => {
    try {
        const { projectId } = req.params;
        // IDOR Fix: Use user ID from JWT instead of req.body
        const uploadedBy = req.user.sub; 

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const result = await artifactService.uploadArtifact(
            parseInt(projectId),
            req.file,
            uploadedBy
        );

        res.status(201).json(result);
    } catch (error) {
        console.error('Error uploading project artifact:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading artifact',
            error: error.message
        });
    }
};

/**
 * Get all artifacts for a project
 */
const getProjectArtifacts = async (req, res) => {
    try {
        const { projectId } = req.params;
        const result = await artifactService.getProjectArtifacts(parseInt(projectId));
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching project artifacts:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching artifacts',
            error: error.message
        });
    }
};

/**
 * Get a specific artifact
 */
const getArtifact = async (req, res) => {
    try {
        const { projectId, artifactId } = req.params;
        const result = await artifactService.getArtifact(
            parseInt(projectId),
            parseInt(artifactId)
        );

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching artifact:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching artifact',
            error: error.message
        });
    }
};

/**
 * Delete an artifact
 */
const deleteArtifact = async (req, res) => {
    try {
        const { projectId, artifactId } = req.params;
        const { cloudinaryPublicId } = req.body;

        const result = await artifactService.deleteArtifact(
            parseInt(projectId),
            parseInt(artifactId),
            cloudinaryPublicId
        );

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting artifact:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting artifact',
            error: error.message
        });
    }
};

/**
 * Update artifact visibility
 */
const updateArtifactVisibility = async (req, res) => {
    try {
        const { projectId, artifactId } = req.params;
        const { isPublic } = req.body;

        if (typeof isPublic !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isPublic must be a boolean value'
            });
        }

        const result = await artifactService.updateVisibility(
            parseInt(projectId),
            parseInt(artifactId),
            isPublic
        );

        if (!result.success) {
            return res.status(404).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating artifact visibility:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating artifact visibility',
            error: error.message
        });
    }
};

module.exports = {
    uploadProjectArtifact,
    getProjectArtifacts,
    getArtifact,
    deleteArtifact,
    updateArtifactVisibility
};
