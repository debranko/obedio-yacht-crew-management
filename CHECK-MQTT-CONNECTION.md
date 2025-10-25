# MQTT Connection Troubleshooting

## Current Status:
✅ MQTT Broker is running (Docker container)
✅ Port 1883 is listening (standard MQTT)
✅ Port 9001 is listening (WebSocket)
✅ Service requests are being created
❌ No MQTT messages appearing in monitor

## Problem:
The frontend MQTT client is not connecting to the broker.

## To Check in Browser:
1. Open Chrome/Edge DevTools (press F12 key)
2. Go to Console tab
3. Look for these errors:
   - "MQTT connection failed"
   - "WebSocket connection failed"
   - "ERR_CONNECTION_REFUSED"

## Common Issues:

### 1. CORS/Security Issue
The browser might block WebSocket connection to localhost:9001

### 2. Wrong MQTT URL
Check if frontend is trying to connect to:
- ✅ Correct: ws://localhost:9001
- ❌ Wrong: wss://localhost:9001 (SSL not configured)

### 3. Docker Network Issue
Docker container might not be accessible from browser

## Quick Fix to Try:

Open browser console and run:
```javascript
// Check if MQTT client exists
console.log(window.mqttClient);

// Try manual connection
const testClient = mqtt.connect('ws://localhost:9001');
testClient.on('connect', () => console.log('MQTT Connected!'));
testClient.on('error', (err) => console.error('MQTT Error:', err));
```

## What should happen:
1. Press button in ESP32 Simulator
2. See MQTT message in console: "📤 MQTT published to obedio/button/..."
3. See message appear in MQTT Monitor
4. Backend creates service request from MQTT message