const { deleteFile } = require('../utils/cloudinary');

/**
 * Handle profile picture upload
 */
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // File is automatically uploaded to Cloudinary via multer middleware
        const fileData = {
            url: req.file.path, // Cloudinary URL
            publicId: req.file.filename, // Cloudinary public ID
            originalName: req.file.originalname,
            size: req.file.size,
            format: req.file.format
        };

        // TODO: Save fileData to database associated with user
        // Example: await updateUserProfilePicture(userId, fileData.url, fileData.publicId);

        res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: fileData
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading profile picture',
            error: error.message
        });
    }
};

/**
 * Handle document upload
 */
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const fileData = {
            url: req.file.path,
            publicId: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            format: req.file.format
        };

        // TODO: Save document info to database
        // Example: await saveDocument(userId, fileData);

        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: fileData
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading document',
            error: error.message
        });
    }
};

/**
 * Handle multiple files upload
 */
const uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const filesData = req.files.map(file => ({
            url: file.path,
            publicId: file.filename,
            originalName: file.originalname,
            size: file.size,
            format: file.format
        }));

        // TODO: Save files info to database

        res.status(200).json({
            success: true,
            message: `${filesData.length} files uploaded successfully`,
            data: filesData
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading files',
            error: error.message
        });
    }
};

/**
 * Delete a file from Cloudinary
 */
const deleteUploadedFile = async (req, res) => {
    try {
        const { publicId } = req.params;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: 'Public ID is required'
            });
        }

        const result = await deleteFile(publicId);

        if (result.result === 'ok') {
            // TODO: Also delete from database
            res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting file',
            error: error.message
        });
    }
};

module.exports = {
    uploadProfilePicture,
    uploadDocument,
    uploadMultipleFiles,
    deleteUploadedFile
};
