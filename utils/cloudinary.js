const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const FILE_SIZE_LIMIT = 15 * 1024 * 1024; // 8MB

// Create storage for different file types
const createCloudinaryStorage = (folder, allowedFormats, transformations = [], resourceType = 'auto') => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req, file) => {
            const params = {
                folder: folder,
                resource_type: resourceType,
                allowed_formats: allowedFormats,
                // moderation: 'perception_point', // Enable this after registering for the Perception Point add-on in Cloudinary
            };

            // For raw files, we MUST ensure the public_id includes the extension
            // to ensure the browser and Cloudinary handle the MIME type correctly.
            if (resourceType === 'raw') {
                const nameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
                const ext = file.originalname.split('.').pop();
                // Append timestamp to ensure uniqueness
                const uniqueName = `${nameWithoutExt}-${Date.now()}.${ext}`;
                params.public_id = uniqueName;
                // 'allowed_formats' is ignored for raw, so we rely on the filename
            } else {
                params.transformation = transformations;
            }

            return params;
        }
    });
};

// Storage configurations for different use cases
const storageConfigs = {
    // For profile pictures (optimize images)
    profilePictures: createCloudinaryStorage('profile_pictures', ['jpg', 'jpeg', 'png', 'gif', 'webp'], [{ quality: 'auto' }], 'auto'),

    // For documents (PDFs, Word docs, etc.) - RAW files with extension preservation
    documents: createCloudinaryStorage(process.env.CLOUDINARY_DOCS_FOLDER || 'documents', ['pdf'], [], 'raw'),

    // For project artifacts - RAW files with extension preservation
    projectArtifacts: createCloudinaryStorage(process.env.CLOUDINARY_PROJECT_FOLDER, ['pdf'], [], 'raw'),

    // For general files - Auto
    general: createCloudinaryStorage('uploads', ['jpg', 'jpeg', 'png', 'gif', 'pdf'], [], 'auto')
};

// Multer upload instances
const uploads = {
    profilePicture: multer({ storage: storageConfigs.profilePictures, limits: { fileSize: FILE_SIZE_LIMIT } }),
    document: multer({ storage: storageConfigs.documents, limits: { fileSize: FILE_SIZE_LIMIT } }),
    projectArtifact: multer({
        storage: storageConfigs.projectArtifacts,
        limits: { fileSize: FILE_SIZE_LIMIT },
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            } else {
                cb(new Error('Only PDF files are allowed for project artifacts'), false);
            }
        }
    }),
    general: multer({ storage: storageConfigs.general, limits: { fileSize: FILE_SIZE_LIMIT } })
};

// Helper function to delete a file from Cloudinary
const deleteFile = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        throw error;
    }
};

// Helper function to get file URL
const getFileUrl = (publicId, options = {}) => {
    return cloudinary.url(publicId, options);
};

module.exports = {
    cloudinary,
    uploads,
    deleteFile,
    getFileUrl,
    storageConfigs
};
