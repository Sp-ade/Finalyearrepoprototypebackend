const db = require('../Database');

class ProjectRepository {
    /**
     * Create a new project
     */
    async createProject(projectData) {
        const {
            name,
            title,
            description,
            department,
            academicYear,
            grade,
            status = 'Active',
            supervisorId = null,
            supervisorRemark = null,
            studentNames,
            studentIds,
            category,
            attachmentUrl = null,
            attachmentMetadata = null
        } = projectData;

        const query = `
            INSERT INTO Projects 
            (title, description, department, academic_year, grade, status, 
             supervisor_id, supervisor_remark, student_names, student_ids)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const values = [
            title,
            description,
            department || 'Not Specified',
            academicYear,
            grade,
            status,
            supervisorId,
            supervisorRemark,
            JSON.stringify(studentNames || []),
            JSON.stringify(studentIds || [])
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Get all projects with tags
     */
    async getAllProjects() {
        const query = `
            SELECT 
                p.*,
                u.first_name || ' ' || u.last_name as supervisor_name,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'tag_id', t.tag_id,
                            'name', t.name
                        )
                    ) FILTER (WHERE t.tag_id IS NOT NULL),
                    '[]'
                ) as tags,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'artifact_id', pa.artifact_id,
                            'file_name', pa.file_name,
                            'file_path', pa.file_path,
                            'file_type', pa.file_type,
                            'uploaded_at', pa.uploaded_at,
                            'is_public', pa.is_public
                        )
                    ) FILTER (WHERE pa.artifact_id IS NOT NULL),
                    '[]'
                ) as artifacts
            FROM Projects p

            LEFT JOIN Users u ON p.supervisor_id = u.id
            LEFT JOIN Project_Tags pt ON p.project_id = pt.project_id
            LEFT JOIN Tags t ON pt.tag_id = t.tag_id
            LEFT JOIN Project_Artifacts pa ON p.project_id = pa.project_id
            -- Filter projects: Must be Active AND (no submission OR approved submission)
            WHERE p.status = 'Active' 
            AND (
                NOT EXISTS (SELECT 1 FROM Project_Submissions WHERE project_id = p.project_id)
                OR 
                EXISTS (SELECT 1 FROM Project_Submissions WHERE project_id = p.project_id AND status = 'Approved')
            )
            GROUP BY p.project_id, u.first_name, u.last_name
            ORDER BY p.created_at DESC
        `;

        const result = await db.query(query);
        return result.rows;
    }

    /**
     * Get a single project by ID with all related data
     */
    async getProjectById(projectId) {
        const query = `
            SELECT 
                p.*,
                u.first_name || ' ' || u.last_name as supervisor_name,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'tag_id', t.tag_id,
                            'name', t.name
                        )
                    ) FILTER (WHERE t.tag_id IS NOT NULL),
                    '[]'
                ) as tags,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'artifact_id', pa.artifact_id,
                            'file_name', pa.file_name,
                            'file_path', pa.file_path,
                            'file_type', pa.file_type,
                            'uploaded_at', pa.uploaded_at,
                            'is_public', pa.is_public
                        )
                    ) FILTER (WHERE pa.artifact_id IS NOT NULL),
                    '[]'
                ) as artifacts
            FROM Projects p

            LEFT JOIN Users u ON p.supervisor_id = u.id
            LEFT JOIN Project_Tags pt ON p.project_id = pt.project_id
            LEFT JOIN Tags t ON pt.tag_id = t.tag_id
            LEFT JOIN Project_Artifacts pa ON p.project_id = pa.project_id
            WHERE p.project_id = $1
            GROUP BY p.project_id, u.first_name, u.last_name
        `;

        const result = await db.query(query, [projectId]);
        return result.rows[0];
    }

    /**
     * Update a project
     */
    async updateProject(projectId, projectData) {
        const {
            title,
            description,
            department,
            academicYear,
            grade,
            status,
            supervisorRemark,
            studentNames,
            studentIds
        } = projectData;

        const query = `
            UPDATE Projects
            SET 
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                department = COALESCE($3, department),
                academic_year = COALESCE($4, academic_year),
                grade = COALESCE($5, grade),
                status = COALESCE($6, status),
                supervisor_remark = COALESCE($7, supervisor_remark),
                student_names = COALESCE($8, student_names),
                student_ids = COALESCE($9, student_ids),
                last_updated = CURRENT_TIMESTAMP
            WHERE project_id = $10
            RETURNING *
        `;

        const values = [
            title,
            description,
            department,
            academicYear,
            grade,
            status,
            supervisorRemark,
            studentNames ? JSON.stringify(studentNames) : null,
            studentIds ? JSON.stringify(studentIds) : null,
            projectId
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    /**
     * Delete a project
     */
    async deleteProject(projectId) {
        const query = `
            DELETE FROM Projects
            WHERE project_id = $1
            RETURNING *
        `;

        const result = await db.query(query, [projectId]);
        return result.rows[0];
    }

    /**
     * Add tags to a project
     */
    async addProjectTags(projectId, tagNames) {
        const client = await db.query('SELECT 1'); // Get connection

        try {
            const tagIds = [];

            for (const tagName of tagNames) {
                // Insert tag if it doesn't exist, or get existing tag
                const tagQuery = `
                    INSERT INTO Tags (name)
                    VALUES ($1)
                    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                    RETURNING tag_id
                `;
                const tagResult = await db.query(tagQuery, [tagName.toLowerCase().trim()]);
                tagIds.push(tagResult.rows[0].tag_id);
            }

            // Link tags to project
            for (const tagId of tagIds) {
                const linkQuery = `
                    INSERT INTO Project_Tags (project_id, tag_id)
                    VALUES ($1, $2)
                    ON CONFLICT (project_id, tag_id) DO NOTHING
                `;
                await db.query(linkQuery, [projectId, tagId]);
            }

            return tagIds;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get tags for a project
     */
    async getProjectTags(projectId) {
        const query = `
            SELECT t.tag_id, t.name
            FROM Tags t
            INNER JOIN Project_Tags pt ON t.tag_id = pt.tag_id
            WHERE pt.project_id = $1
        `;

        const result = await db.query(query, [projectId]);
        return result.rows;
    }

    /**
     * Remove all tags from a project
     */
    async removeProjectTags(projectId) {
        const query = `
            DELETE FROM Project_Tags
            WHERE project_id = $1
        `;

        await db.query(query, [projectId]);
    }
}

module.exports = new ProjectRepository();
