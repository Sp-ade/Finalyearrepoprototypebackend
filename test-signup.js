// Quick test script to verify signup endpoint
const http = require('http');

const data = JSON.stringify({
    email: '123456@nileuniversity.edu.ng',
    password: 'test123',
    firstName: 'Test',
    lastName: 'User',
    role: 'student',
    studentId: 'STU001',
    department: 'Computer Science'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/signup',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Testing POST /api/signup...');

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', body);
        try {
            const json = JSON.parse(body);
            console.log('Parsed JSON:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Could not parse as JSON');
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
