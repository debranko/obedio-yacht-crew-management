// Direct MQTT test script - run with: node TEST-MQTT-DIRECTLY.js
const mqtt = require('mqtt');

console.log('🧪 OBEDIO MQTT Direct Test');
console.log('==========================\n');

// Test connection to MQTT broker
const brokerUrl = 'ws://localhost:9001';
console.log(`📡 Connecting to MQTT broker at: ${brokerUrl}`);

const client = mqtt.connect(brokerUrl, {
  clientId: `obedio-test-${Date.now()}`,
  clean: true,
  connectTimeout: 5000,
  reconnectPeriod: 1000,
});

client.on('connect', () => {
  console.log('✅ Successfully connected to MQTT broker!\n');
  
  // Subscribe to all obedio topics
  client.subscribe('obedio/#', (err) => {
    if (err) {
      console.error('❌ Subscribe error:', err);
    } else {
      console.log('✅ Subscribed to obedio/# topics');
    }
  });
  
  // Simulate button press
  console.log('📤 Sending test button press...');
  const buttonPress = {
    deviceId: 'BTN-TEST-001',
    locationId: 'loc-test-001',
    guestId: null,
    pressType: 'single',
    button: 'main',
    timestamp: new Date().toISOString(),
    battery: 100,
    rssi: -40,
    firmwareVersion: '2.1.0-test',
    sequenceNumber: Date.now()
  };
  
  const topic = 'obedio/button/BTN-TEST-001/press';
  client.publish(topic, JSON.stringify(buttonPress), { qos: 1 }, (err) => {
    if (err) {
      console.error('❌ Publish error:', err);
    } else {
      console.log(`✅ Published to ${topic}`);
      console.log('📨 Message:', JSON.stringify(buttonPress, null, 2));
    }
  });
});

client.on('message', (topic, payload) => {
  console.log(`\n📥 Received message on topic: ${topic}`);
  try {
    const message = JSON.parse(payload.toString());
    console.log('📋 Payload:', JSON.stringify(message, null, 2));
  } catch (e) {
    console.log('📋 Raw payload:', payload.toString());
  }
});

client.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
  process.exit(1);
});

client.on('close', () => {
  console.log('🔌 MQTT connection closed');
});

// Keep script running
console.log('\n👀 Listening for MQTT messages... Press Ctrl+C to exit.\n');

// Test every 5 seconds
setInterval(() => {
  if (client.connected) {
    const testMsg = {
      test: true,
      timestamp: new Date().toISOString(),
      random: Math.floor(Math.random() * 1000)
    };
    client.publish('obedio/test/heartbeat', JSON.stringify(testMsg), { qos: 0 });
    console.log('💓 Heartbeat sent');
  }
}, 5000);