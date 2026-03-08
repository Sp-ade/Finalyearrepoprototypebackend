const db = require('../Database');

// Get all students with their matric numbers
exports.getAllStudents = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.email, 
                s.student_matric_no, 
                s.department, 
                s.role 
            FROM Users u
            JOIN Students s ON u.id = s.user_id
            WHERE u.role = 'student'
            ORDER BY u.first_name ASC, u.last_name ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Set a student's role to leader
exports.setStudentLeader = async (req, res) => {
    try {
        const { userId } = req.params;

        // Verify the user is actually a student
        const checkQuery = await db.query('SELECT role FROM Users WHERE id = $1', [userId]);
        if (checkQuery.rows.length === 0 || checkQuery.rows[0].role !== 'student') {
            return res.status(404).json({ error: 'Student not found.' });
        }

        // Update the role in the Students table
        const updateQuery = `
            UPDATE Students 
            SET role = 'leader' 
            WHERE user_id = $1 
            RETURNING *
        `;
        const result = await db.query(updateQuery, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Student record not found.' });
        }

        res.json({ message: 'Student successfully set as leader', student: result.rows[0] });
    } catch (error) {
        console.error('Error setting student as leader:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
