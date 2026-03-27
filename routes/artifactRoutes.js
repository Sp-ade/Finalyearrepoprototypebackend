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
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

// Upload artifact for a project (Mandatory Auth)
router.post(
    '/:projectId/artifacts',
    authenticate,
    uploads.projectArtifact.single('artifact'),
    uploadProjectArtifact
);

// Get all artifacts for a project (Public/Optional)
router.get('/:projectId/artifacts', optionalAuthenticate, getProjectArtifacts);

// Get a specific artifact (Public/Optional)
router.get('/:projectId/artifacts/:artifactId', optionalAuthenticate, getArtifact);

// Delete an artifact (Mandatory Auth)
router.delete('/:projectId/artifacts/:artifactId', authenticate, deleteArtifact);

// Update artifact visibility (Mandatory Auth)
router.patch('/:projectId/artifacts/:artifactId/visibility', authenticate, updateArtifactVisibility);

module.exports = router;
