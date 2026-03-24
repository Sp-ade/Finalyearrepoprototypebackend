const http = require('http');

async function testProjectReassignment() {
    console.log('Fetching all projects...');
    
    // Fetch all active projects
    const fetchProjects = async () => {
        return new Promise((resolve, reject) => {
            http.get('http://localhost:3000/api/projects', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });
    };

    try {
        const result = await fetchProjects();
        const projects = result.projects || result; // Depends on how index route wraps it

        if (!projects || projects.length === 0) {
            console.log('❌ No active projects found. Cannot test reassignment.');
            return;
        }

        const project = projects[0];

        console.log(`✅ Found project: "${project.title}" (ID: ${project.project_id})`);
        console.log(`Currently assigned to supervisor: ${project.supervisor_name}`);
        
        // Let's reassign to user ID 2 (which is usually an admin/supervisor)
        const newSupervisorId = 2; 
        console.log(`\nReassigning to supervisor ID: ${newSupervisorId}...`);

        const requestData = JSON.stringify({ newSupervisorId });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api/admin/projects/${project.project_id}/reassign-supervisor`,
            method: 'PUT',
            headers: {
                'x-user-role': 'admin',
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
                    console.log('\n🎉 Project reassignment successful!');
                } else {
                    console.log('\n❌ Reassignment failed.');
                }
            });
        });

        req.on('error', error => console.error('Error making the request:', error));

        req.write(requestData);
        req.end();

    } catch (error) {
        console.error('Test failed. Note that tests will fail if backend has not been restarted. Server must be restarted for the new endpoints to be active.', error.message);
    }
}

testProjectReassignment();
