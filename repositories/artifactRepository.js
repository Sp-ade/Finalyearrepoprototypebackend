const db = require('../Database');

class ArtifactRepository {
    /**
     * Create a new project artifact
     */
    async createArtifact(projectId, artifactData) {
        const { fileName, filePath, fileType, uploadedBy, isPublic = false } = artifactData;

        const query = `
            INSERT INTO Project_Artifacts 
            (project_id, file_name, file_path, file_type, uploaded_by, is_public)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [projectId, fileName, filePath, fileType, uploadedBy, isPublic];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Get all artifacts for a project
     */
    async getArtifactsByProjectId(projectId) {
        const query = `
            SELECT 
                pa.*
            FROM Project_Artifacts pa
            WHERE pa.project_id = $1
            ORDER BY pa.uploaded_at DESC
        `;

        const result = await db.query(query, [projectId]);
        return result.rows;
    }

    /**
     * Get a specific artifact
     */
    async getArtifactById(projectId, artifactId) {
        const query = `
        SELECT * FROM Project_Artifacts
            WHERE project_id = $1 AND artifact_id = $2
            `;

        const result = await db.query(query, [projectId, artifactId]);
        return result.rows[0];
    }

    /**
     * Delete an artifact
     */
    async deleteArtifact(projectId, artifactId) {
        const query = `
            DELETE FROM Project_Artifacts
            WHERE project_id = $1 AND artifact_id = $2
        RETURNING *
            `;

        const result = await db.query(query, [projectId, artifactId]);
        return result.rows[0];
    }

    /**
     * Update artifact visibility
     */
    async updateArtifactVisibility(projectId, artifactId, isPublic) {
        const query = `
            UPDATE Project_Artifacts
            SET is_public = $1
            WHERE project_id = $2 AND artifact_id = $3
        RETURNING *
            `;

        const result = await db.query(query, [isPublic, projectId, artifactId]);
        return result.rows[0];
    }

    /**
     * Delete all artifacts for a project
     */
    async deleteAllArtifactsForProject(projectId) {
        const query = `
            DELETE FROM Project_Artifacts
            WHERE project_id = $1
            RETURNING *
        `;

        const result = await db.query(query, [projectId]);
        return result.rows;
    }
}

module.exports = new ArtifactRepository();
