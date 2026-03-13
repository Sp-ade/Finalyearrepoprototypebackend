const submissionRepository = require('../repositories/submissionRepository');
const db = require('../Database');

class SubmissionService {
    /**
     * Submit a project for a student
     */
    async submitProject(studentId, projectId) {
        const existing = await submissionRepository.getExistingByStudent(studentId);
        if (existing) {
            const error = new Error('Student has already submitted a project.');
            error.statusCode = 400;
            throw error;
        }
        return await submissionRepository.create(studentId, projectId);
    }

    /**
     * Get all submissions for a specific project
     */
    async getByProject(projectId) {
        return await submissionRepository.getByProject(projectId);
    }

    /**
     * Get all submissions, optionally filtered by supervisor
     */
    async getAll(supervisorId) {
        return await submissionRepository.getAll(supervisorId);
    }

    /**
     * Review a submission — approve or request changes (uses a DB transaction)
     */
    async reviewSubmission(submissionId, { status, supervisor_response, grade }) {
        if (!['Approved', 'Changes Requested'].includes(status)) {
            const error = new Error('Invalid status. Must be "Approved" or "Changes Requested".');
            error.statusCode = 400;
            throw error;
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const submission = await submissionRepository.reviewWithTransaction(
                client, submissionId, status, supervisor_response
            );

            if (!submission) {
                await client.query('ROLLBACK');
                const error = new Error('Submission not found');
                error.statusCode = 404;
                throw error;
            }

            if (status === 'Approved') {
                await submissionRepository.approveProject(
                    client, submission.project_id, grade, supervisor_response
                );
            }

            await client.query('COMMIT');
            return submission;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Get a student's submission status
     */
    async getStudentSubmission(studentId) {
        const studentInfo = await submissionRepository.getStudentInfo(studentId);
        if (!studentInfo) {
            const error = new Error('Student profile not found');
            error.statusCode = 404;
            throw error;
        }

        const { role, student_matric_no } = studentInfo;
        const submission = await submissionRepository.getStudentSubmission(
            studentId, student_matric_no, role
        );

        return { submitted: !!submission, role, submission: submission || undefined };
    }

    /**
     * Get all supervisors
     */
    async getAllSupervisors() {
        return await submissionRepository.getAllSupervisors();
    }

    /**
     * Resubmit a previously reviewed submission
     */
    async resubmit(submissionId) {
        const result = await submissionRepository.resubmit(submissionId);
        if (!result) {
            const error = new Error('Submission not found');
            error.statusCode = 404;
            throw error;
        }
        return result;
    }
}

module.exports = new SubmissionService();
