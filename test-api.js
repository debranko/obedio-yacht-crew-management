// Test Backend API
const http = require('http');

const data = JSON.stringify({
  username: 'admin',
  password: 'password'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔍 Testing backend API...');
console.log('URL: http://localhost:3001/api/auth/login');
console.log('Payload:', data);
console.log('');

const req = http.request(options, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('');

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('📦 Response Body:');
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('\n✅ LOGIN SUCCESS!');
        console.log('User:', json.data.user.username);
        console.log('Token:', json.data.token.substring(0, 20) + '...');
      } else {
        console.log('\n❌ LOGIN FAILED:', json.message);
      }
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error('🔴 ERROR:', error.message);
  console.error('\nBackend is NOT running or not accessible!');
  console.error('Make sure backend is started with: npm run dev');
});

req.write(data);
req.end();
