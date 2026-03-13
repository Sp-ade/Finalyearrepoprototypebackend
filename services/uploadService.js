const { deleteFile } = require('../utils/cloudinary');

class UploadService {
    /**
     * Extract file data from a multer-processed file (Cloudinary via multer)
     */
    extractFileData(file) {
        return {
            url: file.path,           // Cloudinary URL
            publicId: file.filename,  // Cloudinary public ID
            originalName: file.originalname,
            size: file.size,
            format: file.format
        };
    }

    /**
     * Process a single uploaded file
     */
    processUpload(file) {
        if (!file) {
            const error = new Error('No file uploaded');
            error.statusCode = 400;
            throw error;
        }
        return this.extractFileData(file);
    }

    /**
     * Process multiple uploaded files
     */
    processMultipleUploads(files) {
        if (!files || files.length === 0) {
            const error = new Error('No files uploaded');
            error.statusCode = 400;
            throw error;
        }
        return files.map(file => this.extractFileData(file));
    }

    /**
     * Delete a file from Cloudinary
     */
    async deleteFile(publicId) {
        if (!publicId) {
            const error = new Error('Public ID is required');
            error.statusCode = 400;
            throw error;
        }
        const result = await deleteFile(publicId);
        if (result.result !== 'ok') {
            const error = new Error('File not found on storage');
            error.statusCode = 404;
            throw error;
        }
        return result;
    }
}

module.exports = new UploadService();
