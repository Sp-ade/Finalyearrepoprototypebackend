const db = require('../Database');

async function migrateLeaderAssignments() {
    try {
        console.log('--- Starting Migration: Population of leader_assigned_by ---');

        // 1. Find all students who are leaders but don't have an owner assigned
        const leadersQuery = "SELECT user_id FROM Students WHERE role = 'leader' AND leader_assigned_by IS NULL";
        const leadersRes = await db.query(leadersQuery);
        const leaders = leadersRes.rows;

        if (leaders.length === 0) {
            console.log('No unassigned leaders found. Skipping migration.');
            return;
        }

        console.log(`Found ${leaders.length} leaders to migrate.`);

        for (const student of leaders) {
            let assignedBy = null;

            // Attempt 1: Check Projects table (where student is in the list)
            const projectQuery = `
                SELECT supervisor_id 
                FROM Projects 
                WHERE student_ids LIKE $1 
                LIMIT 1
            `;
            const projectRes = await db.query(projectQuery, [`%${student.user_id}%`]);
            
            if (projectRes.rows[0]) {
                assignedBy = projectRes.rows[0].supervisor_id;
                console.log(`Student ${student.user_id}: Found supervisor ${assignedBy} from Projects table.`);
            } else {
                // Attempt 2: Check Project_Submissions table
                const submissionQuery = `
                    SELECT p.supervisor_id 
                    FROM Project_Submissions s
                    JOIN Projects p ON s.project_id = p.project_id
                    WHERE s.student_id = $1
                    LIMIT 1
                `;
                const submissionRes = await db.query(submissionQuery, [student.user_id]);
                
                if (submissionRes.rows[0]) {
                    assignedBy = submissionRes.rows[0].supervisor_id;
                    console.log(`Student ${student.user_id}: Found supervisor ${assignedBy} from Submissions.`);
                }
            }

            // If we found a supervisor, update the student record
            if (assignedBy) {
                await db.query(
                    'UPDATE Students SET leader_assigned_by = $1 WHERE user_id = $2',
                    [assignedBy, student.user_id]
                );
            } else {
                // Fallback: Assign to the first supervisor available
                const fallbackQuery = "SELECT user_id FROM Users WHERE role = 'supervisor' LIMIT 1";
                const fallbackRes = await db.query(fallbackQuery);
                if (fallbackRes.rows[0]) {
                    assignedBy = fallbackRes.rows[0].user_id;
                    await db.query(
                        'UPDATE Students SET leader_assigned_by = $1 WHERE user_id = $2',
                        [assignedBy, student.user_id]
                    );
                    console.log(`Student ${student.user_id}: No project link. Assigned to fallback supervisor ${assignedBy}.`);
                }
            }
        }

        console.log('--- Migration Complete! ---');
    } catch (error) {
        console.error('--- Migration Failed! ---', error);
        throw error; // Let the caller handle the failure (e.g., stop server start)
    }
}

module.exports = migrateLeaderAssignments;
