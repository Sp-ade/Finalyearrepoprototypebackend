const db = require('../Database');

class ProjectRepository {
    /**
     * Create a new project
     */
    async createProject(projectData) {
        const {
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
        } = projectData;

        // Start a transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO Projects 
                (title, description, department, academic_year, grade, status, 
                 supervisor_id, supervisor_remark, student_names, student_ids)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
            `;

            const values = [
                title || null,
                description || '',
                department || 'Not Specified',
                academicYear || null,
                grade || 'Pending',
                status || 'Active',
                supervisorId || null,
                supervisorRemark || 'Evaluation pending',
                JSON.stringify(studentNames || []),
                JSON.stringify(studentIds || [])
            ];

            const result = await client.query(query, values);
            const project = result.rows[0];

            // Link students to the project via Project_Members.
            // If a pre-project group row already exists for this student, update it.
            // Otherwise insert a fresh row.
            if (Array.isArray(studentIds) && studentIds.length > 0) {
                for (let i = 0; i < studentIds.length; i++) {
                    const studentId = parseInt(studentIds[i]);
                    if (isNaN(studentId)) continue;
                    const role = (i === 0) ? 'Leader' : 'Member';

                    // Resolve the studentId (could be a Users.id OR a matric_no)
                    let resolvedId = studentId;
                    const idCheck = await client.query('SELECT id FROM Users WHERE id = $1', [studentId]);
                    if (idCheck.rows.length === 0) {
                        const matricCheck = await client.query('SELECT user_id FROM Students WHERE student_matric_no = $1', [studentIds[i]]);
                        if (matricCheck.rows.length > 0) {
                            resolvedId = matricCheck.rows[0].user_id;
                        } else {
                            console.warn(`⚠️ Student identifier ${studentIds[i]} could not be resolved. Skipping.`);
                            continue;
                        }
                    }

                    // Try to UPDATE an existing pre-project group row first
                    const updateRes = await client.query(`
                        UPDATE Project_Members
                        SET project_id = $1, role = $2
                        WHERE student_id = $3 AND project_id IS NULL
                        RETURNING id
                    `, [project.project_id, role, resolvedId]);

                    // If no existing group row, insert a new one
                    if (updateRes.rowCount === 0) {
                        await client.query(`
                            INSERT INTO Project_Members (project_id, student_id, role)
                            VALUES ($1, $2, $3)
                        `, [project.project_id, resolvedId, role]);
                    }
                }
            }

            await client.query('COMMIT');
            return project;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
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
                ) as artifacts,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'student_id', pm.student_id,
                            'role', pm.role,
                            'name', studentsu.first_name || ' ' || studentsu.last_name,
                            'matric_no', s.student_matric_no
                        )
                    ) FILTER (WHERE pm.student_id IS NOT NULL),
                    '[]'
                ) as members
            FROM Projects p

            LEFT JOIN Users u ON p.supervisor_id = u.id
            LEFT JOIN Project_Tags pt ON p.project_id = pt.project_id
            LEFT JOIN Tags t ON pt.tag_id = t.tag_id
            LEFT JOIN Project_Artifacts pa ON p.project_id = pa.project_id
            LEFT JOIN Project_Members pm ON p.project_id = pm.project_id
            LEFT JOIN Users studentsu ON pm.student_id = studentsu.id
            LEFT JOIN Students s ON pm.student_id = s.user_id
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
                ) as artifacts,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'student_id', pm.student_id,
                            'role', pm.role,
                            'name', studentsu.first_name || ' ' || studentsu.last_name,
                            'matric_no', s.student_matric_no
                        )
                    ) FILTER (WHERE pm.student_id IS NOT NULL),
                    '[]'
                ) as members
            FROM Projects p

            LEFT JOIN Users u ON p.supervisor_id = u.id
            LEFT JOIN Project_Tags pt ON p.project_id = pt.project_id
            LEFT JOIN Tags t ON pt.tag_id = t.tag_id
            LEFT JOIN Project_Artifacts pa ON p.project_id = pa.project_id
            LEFT JOIN Project_Members pm ON p.project_id = pm.project_id
            LEFT JOIN Users studentsu ON pm.student_id = studentsu.id
            LEFT JOIN Students s ON pm.student_id = s.user_id
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

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

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
                title || null,
                description || null,
                department || null,
                academicYear || null,
                grade || null,
                status || null,
                supervisorRemark || null,
                studentNames ? JSON.stringify(studentNames) : null,
                studentIds ? JSON.stringify(studentIds) : null,
                projectId
            ];

            const result = await client.query(query, values);
            const project = result.rows[0];

            // Only sync members if studentIds was actually passed in the update
            if (studentIds !== undefined) {
                // PRESERVE: Fetch existing group info before deleting rows
                const groupInfoRes = await client.query(
                    'SELECT group_number, year, assigned_by FROM Project_Members WHERE project_id = $1 LIMIT 1',
                    [projectId]
                );
                const groupInfo = groupInfoRes.rows[0] || {};

                // Delete only project-specific member rows
                await client.query(
                    'DELETE FROM Project_Members WHERE project_id = $1',
                    [projectId]
                );

                if (Array.isArray(studentIds)) {
                    for (let i = 0; i < studentIds.length; i++) {
                        const studentId = parseInt(studentIds[i]);
                        if (isNaN(studentId)) continue;
                        const role = (i === 0) ? 'Leader' : 'Member';

                        let resolvedId = studentId;
                        const idCheck = await client.query('SELECT id FROM Users WHERE id = $1', [studentId]);
                        if (idCheck.rows.length === 0) {
                            const matricCheck = await client.query('SELECT user_id FROM Students WHERE student_matric_no = $1', [studentIds[i]]);
                            if (matricCheck.rows.length > 0) {
                                resolvedId = matricCheck.rows[0].user_id;
                            } else {
                                console.warn(`⚠️ Student identifier ${studentIds[i]} could not be resolved. Skipping.`);
                                continue;
                            }
                        }

                        // Re-link: try to update existing pre-project group row first
                        const updateRes = await client.query(`
                            UPDATE Project_Members
                            SET project_id = $1, role = $2
                            WHERE student_id = $3 AND project_id IS NULL
                            RETURNING id
                        `, [projectId, role, resolvedId]);

                        if (updateRes.rowCount === 0) {
                            // Fix: Include preserved group info in the new record
                            await client.query(`
                                INSERT INTO Project_Members (project_id, student_id, role, group_number, year, assigned_by)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                ON CONFLICT (student_id, year) DO UPDATE 
                                SET project_id = $1, role = $3, group_number = EXCLUDED.group_number
                            `, [
                                projectId, 
                                resolvedId, 
                                role, 
                                groupInfo.group_number || null, 
                                groupInfo.year || null, 
                                groupInfo.assigned_by || null
                            ]);
                        }
                    }
                }
            }

            await client.query('COMMIT');
            return project;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
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
    /**
     * Reassign the supervisor for a project
     */
    async reassignProjectSupervisor(projectId, newSupervisorId) {
        const query = `
            UPDATE Projects 
            SET supervisor_id = $1,
                last_updated = CURRENT_TIMESTAMP
            WHERE project_id = $2 
        `;
        await db.query(query, [newSupervisorId, projectId]);
        // Return the full project with joined supervisor name, tags, etc.
        return await this.getProjectById(projectId);
    }
    /**
     * Get all unique tag names
     */
    async getAllTags() {
        const query = 'SELECT name FROM Tags ORDER BY name ASC';
        const result = await db.query(query);
        return result.rows.map(row => row.name);
    }

    /**
     * Find a submission by project and student
     */
    async getSubmissionByProjectAndStudent(projectId, studentId) {
        const query = 'SELECT submission_id, status FROM Project_Submissions WHERE project_id = $1 AND student_id = $2';
        const result = await db.query(query, [projectId, studentId]);
        return result.rows[0];
    }

    /**
     * Check if a student has an approved edit request for a project
     */
    async checkApprovedEditRequest(projectId, studentId) {
        const query = "SELECT 1 FROM Access_Requests_Student WHERE project_id = $1 AND student_id = $2 AND mode = 'edit' AND status = 'Approved'";
        const result = await db.query(query, [projectId, studentId]);
        return result.rows.length > 0;
    }

    /**
     * Check if a student has an active submission that can be edited
     */
    async hasEditableSubmission(projectId, studentId) {
        const query = "SELECT 1 FROM Project_Submissions WHERE project_id = $1 AND student_id = $2 AND status IN ('Pending', 'Changes Requested')";
        const result = await db.query(query, [projectId, studentId]);
        return result.rows.length > 0;
    }
}

module.exports = new ProjectRepository();
