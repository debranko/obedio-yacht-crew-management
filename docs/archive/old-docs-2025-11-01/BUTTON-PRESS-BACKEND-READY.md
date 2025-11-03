# Backend Button Press Handler - READY! ✅

**Status**: Backend is fully prepared to receive button presses from ESP32

**Date**: October 24, 2025

---

## ✅ What Backend Already Has

### 1. **MQTT Topic Subscription**

File: `backend/src/services/mqtt.service.ts`

```typescript
BUTTON_PRESS: 'obedio/button/+/press'
```

- ✅ Subscribes to: `obedio/button/{deviceId}/press`
- ✅ Wildcard `+` matches any deviceId
- ✅ Examples:
  - `obedio/button/HELTEC-A1B2C3D4E5F6/press`
  - `obedio/button/BTN-001/press`

---

### 2. **Button Press Handler** (Lines 174-377)

**Full workflow when button is pressed**:

#### Step 1: Receive Button Press
```typescript
Topic: obedio/button/HELTEC-A1B2C3D4E5F6/press
Payload: {
  "deviceId": "HELTEC-A1B2C3D4E5F6",
  "button": "main",
  "pressType": "single",
  "battery": 85,
  "rssi": -45,
  "firmwareVersion": "v0.1-minimal",
  "timestamp": 123456
}
```

#### Step 2: Get Device from Database
- Looks up device by `deviceId`
- **Auto-creates if doesn't exist** (for virtual buttons)
- Includes location relation

#### Step 3: Get Guest from Location
- If device has `locationId`, finds guest at that location
- If no guest found, creates anonymous request
- Uses most recent guest at location

#### Step 4: Derive Priority & Request Type

**From `pressType`**:
- `single` → `priority: "normal"`, `requestType: "call"`
- `double` → `priority: "urgent"`, `requestType: "call"`
- `long` → `priority: "normal"`, `requestType: "voice"`
- `shake` → `priority: "emergency"`, `requestType: "emergency"`

**From `button` (if multiple buttons)**:
- `main` → call
- `aux1` → DND (Do Not Disturb)
- `aux2` → Lights
- `aux3` → Prepare Food
- `aux4` → Bring Drinks

#### Step 5: Create Service Request

```typescript
await prisma.serviceRequest.create({
  guestId: guest?.id || null,
  locationId: device.locationId || null,
  status: 'pending',
  priority: 'normal',        // derived from pressType
  requestType: 'call',       // derived from button + pressType
  notes: "Service requested from Guest Cabin 1\n\n...",
  guestName: "John Doe",
  guestCabin: "Guest Cabin 1"
});
```

#### Step 6: Log to Device Logs

```typescript
await prisma.deviceLog.create({
  deviceId: device.id,
  eventType: 'button_press',
  eventData: {
    button: 'main',
    pressType: 'single',
    battery: 85,
    rssi: -45,
    priority: 'normal',
    requestType: 'call',
    serviceRequestId: 'xyz123'
  }
});
```

#### Step 7: Emit to WebSocket Clients

```typescript
io.emit('service-request:new', serviceRequest);
```

**Frontend receives this and**:
- Shows toast notification
- Updates Service Requests page
- Updates dashboard widgets
- Plays sound alert (if enabled)

#### Step 8: Publish to MQTT (for T-Watch!)

```typescript
Topic: obedio/service/request
Payload: {
  "id": "cuid123",
  "location": "Guest Cabin 1",
  "guest": "John Doe",
  "priority": "normal",
  "timestamp": "2025-10-24T12:34:56.789Z"
}
```

**T-Watch subscribes to this topic and**:
- Shows notification on screen
- Vibrates
- Plays sound
- Shows ACCEPT and DELEGATE buttons

#### Step 9: Send Acknowledgment to Button

```typescript
Topic: obedio/device/HELTEC-A1B2C3D4E5F6/command
Payload: {
  "command": "ack",
  "requestId": "cuid123",
  "status": "received"
}
```

**Heltec receives this and**:
- Shows "✓" or "OK" on OLED
- Blinks LED
- Confirms request was received

---

## 📋 Message Format - What Heltec Should Send

### Minimal Required Fields

```json
{
  "deviceId": "HELTEC-A1B2C3D4E5F6",
  "button": "main",
  "pressType": "single"
}
```

### Recommended Fields

```json
{
  "deviceId": "HELTEC-A1B2C3D4E5F6",
  "button": "main",
  "pressType": "single",
  "battery": 85,
  "rssi": -45,
  "firmwareVersion": "v0.1-minimal",
  "timestamp": 1729776896
}
```

### Optional Fields (for later)

```json
{
  "deviceId": "HELTEC-A1B2C3D4E5F6",
  "locationId": "cuid-location-123",  // If device knows its location
  "guestId": "cuid-guest-456",        // If device knows the guest
  "sequenceNumber": 42,                // For deduplication
  "button": "main",
  "pressType": "single",
  "battery": 85,
  "rssi": -45,
  "firmwareVersion": "v0.1-minimal",
  "timestamp": 1729776896
}
```

---

## 🧪 How to Test Backend Handler

### Test 1: Start Backend and Check Subscription

**Start backend**:
```bash
cd backend
npm run dev
```

**Check logs for**:
```
✅ MQTT connected successfully
✅ Subscribed to obedio/button/+/press
✅ Subscribed to obedio/device/register
✅ Subscribed to obedio/device/heartbeat
```

---

### Test 2: Send Test Button Press via MQTT

**Option A: Using mosquitto_pub**

```bash
mosquitto_pub -h localhost -t "obedio/button/TEST-BUTTON/press" -m '{
  "deviceId": "TEST-BUTTON",
  "button": "main",
  "pressType": "single",
  "battery": 100,
  "rssi": -50,
  "firmwareVersion": "test",
  "timestamp": 123456
}'
```

**Option B: Using Node.js test script**

Create `backend/test-button-press.js`:
```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');

  const message = {
    deviceId: 'TEST-BUTTON',
    button: 'main',
    pressType: 'single',
    battery: 100,
    rssi: -50,
    firmwareVersion: 'test',
    timestamp: Date.now()
  };

  client.publish(
    'obedio/button/TEST-BUTTON/press',
    JSON.stringify(message),
    (err) => {
      if (err) {
        console.error('Publish error:', err);
      } else {
        console.log('✅ Button press sent!');
        console.log('Message:', message);
      }
      client.end();
    }
  );
});
```

**Run test**:
```bash
node backend/test-button-press.js
```

---

### Test 3: Verify Backend Processes Button Press

**Backend logs should show**:
```
📥 MQTT message: obedio/button/TEST-BUTTON/press { deviceId: 'TEST-BUTTON', ... }
🔘 Button press from TEST-BUTTON: { button: 'main', pressType: 'single', ... }
📱 Auto-creating virtual device: TEST-BUTTON
✅ Virtual device created: Virtual Button TEST
✅ Service request created: cuid123
```

---

### Test 4: Verify Service Request Created

**Check database**:
```bash
# In backend folder
npx prisma studio
```

**Look for**:
- New **Device** record: `deviceId = "TEST-BUTTON"`
- New **ServiceRequest** record: `status = "pending"`, `priority = "normal"`
- New **DeviceLog** record: `eventType = "button_press"`

---

### Test 5: Verify WebSocket Event

**Open frontend** (http://localhost:5173)

**Open browser console** (F12)

**Send button press**

**Should see WebSocket event**:
```javascript
service-request:new {
  id: "cuid123",
  guestName: "Guest",
  guestCabin: "Unknown",
  status: "pending",
  priority: "normal",
  requestType: "call"
}
```

---

### Test 6: Verify MQTT Publish to T-Watch

**Subscribe to service request topic**:
```bash
mosquitto_sub -h localhost -t "obedio/service/request" -v
```

**Send button press**

**Should see**:
```
obedio/service/request {
  "id": "cuid123",
  "location": "Unknown",
  "guest": "Guest",
  "priority": "normal",
  "timestamp": "2025-10-24T12:34:56.789Z"
}
```

---

### Test 7: Verify Acknowledgment Sent Back

**Subscribe to device command topic**:
```bash
mosquitto_sub -h localhost -t "obedio/device/+/command" -v
```

**Send button press**

**Should see**:
```
obedio/device/TEST-BUTTON/command {
  "command": "ack",
  "requestId": "cuid123",
  "status": "received"
}
```

---

## 🎯 Success Criteria

Backend button press handler is working when:

- [x] ✅ Backend subscribes to `obedio/button/+/press`
- [x] ✅ Receives button press message via MQTT
- [x] ✅ Logs: `🔘 Button press from {deviceId}`
- [x] ✅ Creates Device record (or finds existing)
- [x] ✅ Creates ServiceRequest record
- [x] ✅ Creates DeviceLog record
- [x] ✅ Emits WebSocket event `service-request:new`
- [x] ✅ Publishes to MQTT `obedio/service/request`
- [x] ✅ Sends acknowledgment `obedio/device/{deviceId}/command`

---

## 🚀 Next Steps - Add Button to Heltec Firmware

Now that backend is ready, we need to add button press to Heltec firmware:

### Heltec Button Press Code

```cpp
// hardware/heltec-minimal/heltec-minimal.ino

#define BUTTON_PIN 0  // Built-in USER button

void setup() {
  // ... existing setup ...

  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  // ... existing loop ...

  // Check button press
  if (digitalRead(BUTTON_PIN) == LOW) {
    handleButtonPress();
    delay(500); // Debounce
  }
}

void handleButtonPress() {
  Serial.println("🔘 Button pressed!");

  // Build MQTT message
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["button"] = "main";
  doc["pressType"] = "single";
  doc["battery"] = 100;  // TODO: Read from GPIO1
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  // Publish to MQTT
  String topic = "obedio/button/" + deviceId + "/press";
  bool success = mqttClient.publish(topic.c_str(), payload.c_str());

  if (success) {
    Serial.println("✅ Button press sent!");
    displayText("Button Pressed!", 170, TFT_GREEN, true);
  } else {
    Serial.println("❌ Button press failed!");
  }
}
```

---

## 📊 Complete Flow - Button Press to Service Request

```
┌─────────────────────┐
│  Heltec ESP32       │
│  (Guest Cabin 1)    │
│                     │
│  🔘 Button pressed  │
└──────────┬──────────┘
           │
           │ MQTT: obedio/button/HELTEC-XXX/press
           │ { deviceId, button, pressType, battery, rssi }
           ▼
┌─────────────────────┐
│  MQTT Broker        │
│  (Mosquitto)        │
└──────────┬──────────┘
           │
           │ Forward to subscribers
           ▼
┌─────────────────────────────────────────────────────────┐
│  Backend MQTT Service                                   │
│  mqtt.service.ts                                        │
│                                                         │
│  1. Receive button press                               │
│  2. Get device from DB (auto-create if needed)         │
│  3. Get guest from location                            │
│  4. Derive priority from pressType                     │
│  5. Create ServiceRequest                              │
│  6. Log to DeviceLog                                   │
│  7. Emit WebSocket event                               │
│  8. Publish to MQTT (for T-Watch)                      │
│  9. Send ACK to button                                 │
└──────────┬─────────────────┬──────────────────┬─────────┘
           │                 │                  │
           │                 │                  │
           ▼                 ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────────┐
    │ WebSocket│      │   MQTT   │      │  PostgreSQL  │
    │  Event   │      │ Publish  │      │   Database   │
    └────┬─────┘      └────┬─────┘      └──────────────┘
         │                 │
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Frontend       │  │  T-Watch S3     │
│  (Dashboard)    │  │  (Crew Member)  │
│                 │  │                 │
│  📢 New request │  │  📳 Vibrate     │
│  🔔 Toast       │  │  🔔 Show alert  │
│  🎵 Sound       │  │  👆 ACCEPT btn  │
└─────────────────┘  └─────────────────┘
```

---

## 🎉 Summary

**Backend is FULLY READY for button presses!**

No changes needed to backend - it already:
- ✅ Subscribes to button press topic
- ✅ Processes button press events
- ✅ Creates service requests
- ✅ Notifies frontend via WebSocket
- ✅ Notifies T-Watch via MQTT
- ✅ Sends acknowledgment back to button

**All we need to do**:
1. ✅ Test backend with manual MQTT message (see tests above)
2. ⏳ Add button press code to Heltec firmware
3. ⏳ Test with real button on Heltec
4. ⏳ Verify service request appears in frontend
5. ⏳ Add T-Watch notification handler (later)

---

*Last Updated: October 24, 2025*
*OBEDIO Development Team*
