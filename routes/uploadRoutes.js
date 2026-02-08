const express = require('express');
const router = express.Router();
const { uploads } = require('../utils/cloudinary');
const {
    uploadProfilePicture,
    uploadDocument,
    uploadMultipleFiles,
    deleteUploadedFile
} = require('../controllers/uploadController');

// Upload profile picture (single file)
router.post('/profile-picture', uploads.profilePicture.single('profilePicture'), uploadProfilePicture);

// Upload document (single file)
router.post('/document', uploads.document.single('document'), uploadDocument);

// Upload project artifact (single file)
router.post('/project-artifact', uploads.projectArtifact.single('document'), uploadDocument);

// Upload multiple files
router.post('/multiple', uploads.general.array('files', 10), uploadMultipleFiles);

// Delete file by public ID
router.delete('/:publicId', deleteUploadedFile);

module.exports = router;
