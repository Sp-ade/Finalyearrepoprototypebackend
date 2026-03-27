const express = require('express');
const router = express.Router();
const { uploads } = require('../utils/cloudinary');
const {
    uploadProjectArtifact,
    getProjectArtifacts,
    getArtifact,
    deleteArtifact,
    updateArtifactVisibility
} = require('../controllers/artifactController');
const authenticate = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Upload artifact for a project
router.post(
    '/:projectId/artifacts',
    uploads.projectArtifact.single('artifact'),
    uploadProjectArtifact
);

// Get all artifacts for a project
router.get('/:projectId/artifacts', getProjectArtifacts);

// Get a specific artifact
router.get('/:projectId/artifacts/:artifactId', getArtifact);

// Delete an artifact
router.delete('/:projectId/artifacts/:artifactId', deleteArtifact);

// Update artifact visibility
router.patch('/:projectId/artifacts/:artifactId/visibility', updateArtifactVisibility);

module.exports = router;
