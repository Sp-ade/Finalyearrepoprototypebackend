const uploadService = require('../services/uploadService');

/**
 * Handle profile picture upload
 */
const uploadProfilePicture = async (req, res) => {
    try {
        const fileData = uploadService.processUpload(req.file);
        res.status(200).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: fileData
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error uploading profile picture'
        });
    }
};

/**
 * Handle document upload
 */
const uploadDocument = async (req, res) => {
    try {
        const fileData = uploadService.processUpload(req.file);
        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: fileData
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error uploading document'
        });
    }
};

/**
 * Handle multiple files upload
 */
const uploadMultipleFiles = async (req, res) => {
    try {
        const filesData = uploadService.processMultipleUploads(req.files);
        res.status(200).json({
            success: true,
            message: `${filesData.length} files uploaded successfully`,
            data: filesData
        });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error uploading files'
        });
    }
};

/**
 * Delete a file from Cloudinary
 */
const deleteUploadedFile = async (req, res) => {
    try {
        const { publicId } = req.params;
        await uploadService.deleteFile(publicId);
        res.status(200).json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Error deleting file'
        });
    }
};

module.exports = {
    uploadProfilePicture,
    uploadDocument,
    uploadMultipleFiles,
    deleteUploadedFile
};
