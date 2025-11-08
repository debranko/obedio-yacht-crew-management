/**
 * Test script: Simulate ESP32 button press to create a service request
 * This will trigger a notification on the Wear OS watch
 */

const http = require('http');

// Simulate ESP32 POST /api/service-requests/button
const data = JSON.stringify({
  buttonId: 'BTN001',
  locationId: 'master-bedroom', // Adjust if needed
  requestType: 'call',
  priority: 'urgent', // urgent = vibration on watch!
  message: 'TEST from button simulator'
});

const options = {
  hostname: '192.168.5.150',
  port: 8080,
  path: '/api/service-requests/button',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Simulating button press...');
console.log('📍 Location: Master Bedroom');
console.log('🔔 Priority: URGENT (watch will vibrate)');
console.log('');

const req = http.request(options, (res) => {
  let response = '';

  res.on('data', (chunk) => {
    response += chunk;
  });

  res.on('end', () => {
    console.log(`✅ Response status: ${res.statusCode}`);
    console.log('📦 Response body:', response);
    console.log('');
    console.log('👀 Check your TicWatch now!');
    console.log('   Expected: Full-screen notification with vibration');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(data);
req.end();
