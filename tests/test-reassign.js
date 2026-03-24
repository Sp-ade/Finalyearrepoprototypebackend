const http = require('http');

async function testReassignment() {
    console.log('Fetching all students to find a leader...');

    // Node.js < 18 fallback or using built-in fetch if available
    const fetchStudents = async () => {
        return new Promise((resolve, reject) => {
            http.get('http://localhost:3000/api/supervisors/students', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });
    };

    try {
        const students = await fetchStudents();
        const leader = students.find(s => s.role === 'leader');

        if (!leader) {
            console.log('❌ No student found with role "leader". Cannot test reassignment.');
            console.log('Please assign a student as a leader first!');
            return;
        }

        console.log(`✅ Found student leader: ${leader.first_name} ${leader.last_name} (ID: ${leader.id})`);
        console.log(`Currently assigned by: ${leader.supervisor_first_name || 'Unknown'} ${leader.supervisor_last_name || 'Unknown'}`);

        // Let's reassign to user ID 2 (which is usually an admin/supervisor from initialization)
        const newSupervisorId = 6;
        console.log(`\nReassigning to supervisor ID: ${newSupervisorId}...`);

        const requestData = JSON.stringify({ newSupervisorId });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/admin/students/${leader.id}/reassign-supervisor`,
            method: 'PUT',
            headers: {
                'x-user-role': 'admin', // Mock admin auth
                'Content-Type': 'application/json',
                'Content-Length': requestData.length
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`\nStatus Code: ${res.statusCode}`);
                console.log('Response:', JSON.parse(data));

                if (res.statusCode === 200) {
                    console.log('\n🎉 Reassignment API transfer successful!');
                } else {
                    console.log('\n❌ Reassignment failed. Ensure user ID 2 actually has the "supervisor" role.');
                }
            });
        });

        req.on('error', error => {
            console.error('Error making the request:', error);
        });

        req.write(requestData);
        req.end();

    } catch (error) {
        console.error('Test failed. Is your backend server running on port 3000?', error.message);
    }
}

testReassignment();
