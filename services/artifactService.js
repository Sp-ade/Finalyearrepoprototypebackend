const artifactRepository = require('../repositories/artifactRepository');
const { deleteFile } = require('../utils/cloudinary');

class ArtifactService {
    /**
     * Upload artifact to Cloudinary and save to database
     */
    async uploadArtifact(projectId, file, uploadedBy = null) {
        try {
            // File is already uploaded to Cloudinary via multer middleware
            // Extract file information
            const artifactData = {
                fileName: file.originalname,
                filePath: file.path, // Cloudinary URL
                fileType: file.format || file.mimetype,
                uploadedBy: uploadedBy,
                isPublic: false // Default to private
            };

            // Save to database
            const artifact = await artifactRepository.createArtifact(projectId, artifactData);

            return {
                success: true,
                artifact: {
                    ...artifact,
                    cloudinaryPublicId: file.filename // Store for deletion later
                }
            };
        } catch (error) {
            console.error('Error uploading artifact:', error);
            throw error;
        }
    }

    /**
     * Get all artifacts for a project
     */
    async getProjectArtifacts(projectId) {
        try {
            const artifacts = await artifactRepository.getArtifactsByProjectId(projectId);
            return {
                success: true,
                artifacts
            };
        } catch (error) {
            console.error('Error fetching artifacts:', error);
            throw error;
        }
    }

    /**
     * Get a specific artifact
     */
    async getArtifact(projectId, artifactId) {
        try {
            const artifact = await artifactRepository.getArtifactById(projectId, artifactId);
            if (!artifact) {
                return {
                    success: false,
                    message: 'Artifact not found'
                };
            }
            return {
                success: true,
                artifact
            };
        } catch (error) {
            console.error('Error fetching artifact:', error);
            throw error;
        }
    }

    /**
     * Delete artifact from Cloudinary and database
     */
    async deleteArtifact(projectId, artifactId, cloudinaryPublicId) {
        try {
            // Delete from database first
            const deletedArtifact = await artifactRepository.deleteArtifact(projectId, artifactId);

            if (!deletedArtifact) {
                return {
                    success: false,
                    message: 'Artifact not found'
                };
            }

            // Delete from Cloudinary if publicId provided
            if (cloudinaryPublicId) {
                await deleteFile(cloudinaryPublicId);
            }

            return {
                success: true,
                message: 'Artifact deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting artifact:', error);
            throw error;
        }
    }

    /**
     * Update artifact visibility
     */
    async updateVisibility(projectId, artifactId, isPublic) {
        try {
            const artifact = await artifactRepository.updateArtifactVisibility(projectId, artifactId, isPublic);

            if (!artifact) {
                return {
                    success: false,
                    message: 'Artifact not found'
                };
            }

            return {
                success: true,
                artifact
            };
        } catch (error) {
            console.error('Error updating artifact visibility:', error);
            throw error;
        }
    }
}

module.exports = new ArtifactService();
