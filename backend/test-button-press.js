/**
 * Test Button Press Handler
 *
 * This script simulates an ESP32 button press by publishing an MQTT message
 * to test the backend button press handler.
 *
 * Usage:
 *   node test-button-press.js [pressType]
 *
 * Examples:
 *   node test-button-press.js single
 *   node test-button-press.js double
 *   node test-button-press.js long
 *   node test-button-press.js shake
 */

const mqtt = require('mqtt');

// Configuration
const MQTT_BROKER = 'mqtt://localhost:1883';
const DEVICE_ID = 'TEST-BUTTON-001';

// Get press type from command line or default to 'single'
const pressType = process.argv[2] || 'single';

console.log('========================================');
console.log('OBEDIO - Button Press Test');
console.log('========================================\n');

console.log('Connecting to MQTT broker:', MQTT_BROKER);

const client = mqtt.connect(MQTT_BROKER, {
  clientId: `test-button-${Date.now()}`,
  clean: true
});

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker\n');

  // Build message
  const message = {
    deviceId: DEVICE_ID,
    button: 'main',
    pressType: pressType,
    battery: Math.floor(Math.random() * 40) + 60,  // 60-100%
    rssi: Math.floor(Math.random() * 30) - 70,      // -70 to -40 dBm
    firmwareVersion: 'v1.0.0-test',
    timestamp: Date.now()
  };

  const topic = `obedio/button/${DEVICE_ID}/press`;

  console.log('Publishing button press:');
  console.log('Topic:', topic);
  console.log('Message:', JSON.stringify(message, null, 2));
  console.log('');

  client.publish(topic, JSON.stringify(message), (err) => {
    if (err) {
      console.error('❌ Publish error:', err);
      process.exit(1);
    } else {
      console.log('✅ Button press sent!');
      console.log('');
      console.log('Expected backend behavior:');
      console.log('  1. 🔘 Log: "Button press from TEST-BUTTON-001"');
      console.log('  2. 📱 Auto-create device (if not exists)');
      console.log('  3. ✅ Create service request');
      console.log('  4. 📤 Emit WebSocket event: service-request:new');
      console.log('  5. 📤 Publish MQTT: obedio/service/request');
      console.log('  6. 📤 Send ACK: obedio/device/TEST-BUTTON-001/command');
      console.log('');

      // Subscribe to acknowledgment
      client.subscribe(`obedio/device/${DEVICE_ID}/command`, (err) => {
        if (err) {
          console.error('❌ Subscribe error:', err);
        } else {
          console.log('📡 Listening for acknowledgment...\n');
        }
      });

      // Listen for 5 seconds
      setTimeout(() => {
        console.log('\n⏱️  Timeout - closing connection');
        client.end();
        process.exit(0);
      }, 5000);
    }
  });
});

client.on('message', (topic, payload) => {
  console.log('📥 Received acknowledgment:');
  console.log('Topic:', topic);
  console.log('Payload:', payload.toString());
  console.log('');

  try {
    const message = JSON.parse(payload.toString());
    if (message.command === 'ack') {
      console.log('✅ Button press acknowledged!');
      console.log('Request ID:', message.requestId);
      console.log('Status:', message.status);
      console.log('');
      client.end();
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Parse error:', error);
  }
});

client.on('error', (error) => {
  console.error('❌ MQTT error:', error);
  process.exit(1);
});

client.on('close', () => {
  console.log('🔌 Connection closed');
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Interrupted - closing connection');
  client.end();
  process.exit(0);
});
