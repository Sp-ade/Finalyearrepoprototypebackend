const projectRepository = require('../repositories/projectRepository');
const artifactRepository = require('../repositories/artifactRepository');
// Import cloudinary utils at the top level
const { deleteFile } = require('../utils/cloudinary');

class ProjectService {
    /**
     * Create a new project with tags and optional artifact
     */
    async createProject(projectData) {
        try {
            const {
                name,
                title,
                description,
                supervisor,
                Studentnames = [],
                StudentIDs = [],
                Tags = [],
                category = 'General',
                year,
                grade,
                finalRemark,
                attachment = null,
                attachments = null,
                supervisorId,
                status
            } = projectData;

            // Create the project
            const project = await projectRepository.createProject({
                name: name || title,
                title: title || name,
                description: description || '',
                department: category,
                academicYear: year || new Date().getFullYear().toString(),
                grade: grade || 'Pending',
                status: status || 'Active',
                supervisorRemark: finalRemark || 'Evaluation pending',
                studentNames: Studentnames,
                studentIds: StudentIDs,
                supervisorId
            });

            // Add tags if provided
            if (Tags && Tags.length > 0) {
                await projectRepository.addProjectTags(project.project_id, Tags);
            }

            // Handle multiple attachments (new format)
            if (attachments && Array.isArray(attachments) && attachments.length > 0) {
                for (const att of attachments) {
                    const artifactData = {
                        fileName: att.originalName || att.fileName || 'document',
                        filePath: att.url,
                        fileType: att.fileType || 'application/pdf',
                        uploadedBy: null,
                        isPublic: true
                    };
                    await artifactRepository.createArtifact(project.project_id, artifactData);
                }
            }
            // Handle single attachment (legacy format)
            else if (attachment) {
                const artifactData = {
                    fileName: attachment.originalName || attachment.fileName || 'document',
                    filePath: attachment.url,
                    fileType: attachment.fileType || 'application/pdf',
                    uploadedBy: null,
                    isPublic: true
                };
                await artifactRepository.createArtifact(project.project_id, artifactData);
            }

            // Fetch the complete project with tags and artifacts
            const completeProject = await projectRepository.getProjectById(project.project_id);

            return {
                success: true,
                project: this.formatProjectForResponse(completeProject)
            };
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    /**
     * Get all projects
     */
    async getAllProjects() {
        try {
            const projects = await projectRepository.getAllProjects();

            return {
                success: true,
                projects: projects.map(p => this.formatProjectForResponse(p))
            };
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    /**
     * Get a single project by ID
     */
    async getProjectById(projectId) {
        try {
            const project = await projectRepository.getProjectById(projectId);

            if (!project) {
                return {
                    success: false,
                    message: 'Project not found'
                };
            }

            return {
                success: true,
                project: this.formatProjectForResponse(project)
            };
        } catch (error) {
            console.error('Error fetching project:', error);
            throw error;
        }
    }

    /**
     * Update a project
     */
    async updateProject(projectId, projectData) {
        try {
            const {
                title,
                description,
                category,
                year,
                grade,
                finalRemark,
                Studentnames,
                StudentIDs,
                Tags
            } = projectData;

            // Update the project
            const updatedProject = await projectRepository.updateProject(projectId, {
                title,
                description,
                department: category,
                academicYear: year,
                grade,
                supervisorRemark: finalRemark,
                studentNames: Studentnames,
                studentIds: StudentIDs
            });

            if (!updatedProject) {
                return {
                    success: false,
                    message: 'Project not found'
                };
            }

            // Update tags if provided
            if (Tags) {
                await projectRepository.removeProjectTags(projectId);
                if (Tags.length > 0) {
                    await projectRepository.addProjectTags(projectId, Tags);
                }
            }

            // Update attachments if provided
            if (projectData.attachments && Array.isArray(projectData.attachments)) {
                await artifactRepository.deleteAllArtifactsForProject(projectId);
                for (const att of projectData.attachments) {
                    const artifactData = {
                        fileName: att.fileName || att.originalName || 'document',
                        filePath: att.url || att.file_path,
                        fileType: att.fileType || att.file_type || 'application/pdf',
                        uploadedBy: null,
                        isPublic: true
                    };
                    await artifactRepository.createArtifact(projectId, artifactData);
                }
            }

            // Fetch the complete updated project
            const completeProject = await projectRepository.getProjectById(projectId);

            return {
                success: true,
                project: this.formatProjectForResponse(completeProject)
            };
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        console.log(`[ProjectService] Attempting to delete project ID: ${projectId}`);
        try {
            // Validate projectId
            if (!projectId || isNaN(projectId)) {
                throw new Error(`Invalid project ID: ${projectId}`);
            }

            // First, get all artifacts for the project
            let artifacts = [];
            try {
                artifacts = await artifactRepository.getArtifactsByProjectId(projectId);
                console.log(`[ProjectService] Found ${artifacts.length} artifacts to delete for project ${projectId}`);
            } catch (err) {
                console.error(`[ProjectService] Error fetching artifacts for project ${projectId}:`, err);
            }

            if (artifacts && artifacts.length > 0) {
                for (const artifact of artifacts) {
                    try {
                        if (artifact.file_path) {
                            const urlParts = artifact.file_path.split('/');
                            const uploadIndex = urlParts.indexOf('upload');

                            if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
                                let publicIdParts = urlParts.slice(uploadIndex + 1);
                                if (publicIdParts.length > 0 && publicIdParts[0].startsWith('v') && !isNaN(parseInt(publicIdParts[0].substring(1)))) {
                                    publicIdParts = publicIdParts.slice(1);
                                }
                                const publicIdWithExt = publicIdParts.join('/');
                                const lastDotIndex = publicIdWithExt.lastIndexOf('.');
                                const publicId = lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;

                                if (publicId) {
                                    await deleteFile(publicId);
                                }
                            }
                        }
                    } catch (err) {
                        console.error(`[ProjectService] Failed to delete artifact ${artifact.artifact_id} from Cloudinary:`, err);
                    }

                    try {
                        await artifactRepository.deleteArtifact(projectId, artifact.artifact_id);
                    } catch (dbErr) {
                        console.error(`[ProjectService] Failed to delete artifact ${artifact.artifact_id} from DB:`, dbErr);
                    }
                }
            }

            const deletedProject = await projectRepository.deleteProject(projectId);

            if (!deletedProject) {
                return { success: false, message: 'Project not found' };
            }

            return { success: true, message: 'Project deleted successfully' };
        } catch (error) {
            console.error('[ProjectService] Critical error deleting project:', error);
            throw error;
        }
    }

    /**
     * Reassign the supervisor for a project
     */
    async reassignSupervisor(projectId, newSupervisorId) {
        try {
            const updatedProject = await projectRepository.reassignProjectSupervisor(projectId, newSupervisorId);
            if (!updatedProject) {
                return { success: false, message: 'Project not found' };
            }
            return {
                success: true,
                project: this.formatProjectForResponse(updatedProject)
            };
        } catch (error) {
            console.error('Error reassigning supervisor:', error);
            throw error;
        }
    }

    /**
     * Format project data for API response to match the old JSON format
     */
    formatProjectForResponse(project) {
        // Preference the new normalized "members" array if available
        let studentNames = [];
        let studentIds = [];
        
        if (project.members && Array.isArray(project.members) && project.members.length > 0) {
            // Sort by role (Leader first) to maintain existing logic where first index is leader
            const sortedMembers = [...project.members].sort((a, b) => {
                if (a.role === 'Leader') return -1;
                if (b.role === 'Leader') return 1;
                return 0;
            });
            
            studentNames = sortedMembers.map(m => m.name);
            studentIds = sortedMembers.map(m => m.student_id);
        } else {
            // Fallback to old JSON parsing for backward compatibility 
            // (useful if some projects weren't migrated or during transitional database states)
            if (project.student_names) {
                try {
                    studentNames = typeof project.student_names === 'string'
                        ? JSON.parse(project.student_names)
                        : project.student_names;
                } catch (e) {
                    studentNames = [];
                }
            }

            if (project.student_ids) {
                try {
                    studentIds = typeof project.student_ids === 'string'
                        ? JSON.parse(project.student_ids)
                        : project.student_ids;
                } catch (e) {
                    studentIds = [];
                }
            }
        }

        // Parse tags array
        let tags = [];
        if (project.tags) {
            tags = Array.isArray(project.tags)
                ? project.tags.map(t => t.name)
                : [];
        }

        // Get primary artifact (first one if multiple exist)
        let attachment = null;
        if (project.artifacts && Array.isArray(project.artifacts) && project.artifacts.length > 0) {
            const primaryArtifact = project.artifacts[0];
            if (primaryArtifact && primaryArtifact.artifact_id) {
                attachment = {
                    url: primaryArtifact.file_path,
                    fileName: primaryArtifact.file_name,
                    originalName: primaryArtifact.file_name,
                    fileType: primaryArtifact.file_type
                };
            }
        }

        // Format to match the old JSON structure
        return {
            id: project.project_id,
            name: project.title, // Use title as name for backward compatibility
            title: project.title,
            description: project.description || '',
            supervisor: project.supervisor_name || 'TBD',
            supervisor_id: project.supervisor_id, // Add supervisor_id for filtering
            StudentCount: studentNames.length,
            Studentnames: studentNames,
            StudentIDs: studentIds,
            Tags: tags,
            category: project.department || 'General',
            year: project.academic_year || new Date().getFullYear().toString(),
            grade: project.grade || 'Pending',
            finalRemark: project.supervisor_remark || 'Evaluation pending',
            artifacts: project.artifacts || [],
            attachments: project.artifacts || [], // Alias for frontend compatibility
            ...(attachment && { attachment })
        };
    }
}

module.exports = new ProjectService();
