/**
 * Test script to simulate device status changes via MQTT
 * This will help debug WebSocket real-time updates
 */

const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

// Test device ID - use an existing device or let backend auto-create
const deviceId = 'TEST-DEVICE-001';
const locationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Master Bedroom

console.log('🔌 Connecting to MQTT broker...');

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  
  // Subscribe to device topics to see responses
  client.subscribe('obedio/device/+/command');
  client.subscribe('obedio/device/+/registered');
  console.log('📥 Subscribed to device command topics');
  
  // Simulate device registration first
  console.log('\n📱 Step 1: Registering device...');
  const registerMessage = {
    deviceId: deviceId,
    type: 'smart_button',
    name: 'Test Device 001',
    firmwareVersion: 'v1.0.0-test',
    hardwareVersion: 'ESP32-TEST',
    macAddress: '00:11:22:33:44:55',
    ipAddress: '192.168.1.100',
    rssi: -50
  };
  
  client.publish('obedio/device/register', JSON.stringify(registerMessage));
  console.log('📤 Published registration:', registerMessage);
  
  // Wait 2 seconds then send status updates
  setTimeout(() => {
    console.log('\n🔄 Step 2: Sending device status (ONLINE)...');
    const statusOnline = {
      deviceId: deviceId,
      online: true,
      battery: 85,
      rssi: -45,
      type: 'smart_button',
      firmware: 'v1.0.0-test',
      hardware: 'ESP32-TEST'
    };
    
    client.publish(`obedio/button/${deviceId}/status`, JSON.stringify(statusOnline));
    console.log('📤 Published status:', statusOnline);
  }, 2000);
  
  // After 5 seconds, change battery level
  setTimeout(() => {
    console.log('\n🔋 Step 3: Updating battery level (LOW)...');
    const telemetryUpdate = {
      battery: 15,  // Low battery
      rssi: -55,
      uptime: 3600,
      freeHeap: 45000
    };
    
    client.publish(`obedio/device/${deviceId}/telemetry`, JSON.stringify(telemetryUpdate));
    console.log('📤 Published telemetry:', telemetryUpdate);
  }, 5000);
  
  // After 8 seconds, send device offline
  setTimeout(() => {
    console.log('\n📴 Step 4: Sending device status (OFFLINE)...');
    const statusOffline = {
      deviceId: deviceId,
      online: false,
      battery: 10,
      rssi: -80,
      type: 'smart_button'
    };
    
    client.publish(`obedio/button/${deviceId}/status`, JSON.stringify(statusOffline));
    console.log('📤 Published status:', statusOffline);
  }, 8000);
  
  // After 12 seconds, bring device back online
  setTimeout(() => {
    console.log('\n📶 Step 5: Sending device status (ONLINE AGAIN)...');
    const statusBackOnline = {
      deviceId: deviceId,
      online: true,
      battery: 100,  // Fully charged
      rssi: -40,
      type: 'smart_button'
    };
    
    client.publish(`obedio/button/${deviceId}/status`, JSON.stringify(statusBackOnline));
    console.log('📤 Published status:', statusBackOnline);
  }, 12000);
  
  // After 15 seconds, send a heartbeat
  setTimeout(() => {
    console.log('\n💓 Step 6: Sending heartbeat...');
    const heartbeat = {
      deviceId: deviceId,
      type: 'smart_button',
      status: 'online',
      rssi: -42,
      uptime: 15000,
      freeHeap: 50000
    };
    
    client.publish('obedio/device/heartbeat', JSON.stringify(heartbeat));
    console.log('📤 Published heartbeat:', heartbeat);
  }, 15000);
  
  // Close connection after 20 seconds
  setTimeout(() => {
    console.log('\n👋 Test complete. Disconnecting...');
    client.end();
    process.exit(0);
  }, 20000);
});

// Log any messages we receive
client.on('message', (topic, message) => {
  console.log(`\n📨 Received message on ${topic}:`, message.toString());
});

client.on('error', (error) => {
  console.error('❌ MQTT error:', error);
});

console.log('\n📊 Test Timeline:');
console.log('0s  - Device registration');
console.log('2s  - Device goes online (battery: 85%)'); 
console.log('5s  - Battery level drops to 15%');
console.log('8s  - Device goes offline');
console.log('12s - Device comes back online (battery: 100%)');
console.log('15s - Heartbeat sent');
console.log('20s - Test ends');
console.log('\n⚡ Watch the Device Manager page for real-time updates!');