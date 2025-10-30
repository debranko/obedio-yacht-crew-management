# Quick Test - Button Press Handler 🧪

**Goal**: Verify backend button press handler works BEFORE uploading to ESP32

**Time**: 2 minutes

---

## Prerequisites

- ✅ Mosquitto running (Docker)
- ✅ Backend running (`npm run dev`)
- ✅ Frontend running (optional, for WebSocket test)

---

## Test 1: Simple Button Press Test

### Step 1: Start Backend

```bash
cd backend
npm run dev
```

**Look for in logs**:
```
✅ MQTT connected successfully
✅ Subscribed to obedio/button/+/press
✅ Subscribed to obedio/device/register
✅ Subscribed to obedio/device/heartbeat
```

---

### Step 2: Run Test Script

**Open new terminal**:
```bash
cd backend
node test-button-press.js
```

**Should see**:
```
========================================
OBEDIO - Button Press Test
========================================

Connecting to MQTT broker: mqtt://localhost:1883
✅ Connected to MQTT broker

Publishing button press:
Topic: obedio/button/TEST-BUTTON-001/press
Message: {
  "deviceId": "TEST-BUTTON-001",
  "button": "main",
  "pressType": "single",
  "battery": 85,
  "rssi": -45,
  "firmwareVersion": "v1.0.0-test",
  "timestamp": 1729776896000
}

✅ Button press sent!

Expected backend behavior:
  1. 🔘 Log: "Button press from TEST-BUTTON-001"
  2. 📱 Auto-create device (if not exists)
  3. ✅ Create service request
  4. 📤 Emit WebSocket event: service-request:new
  5. 📤 Publish MQTT: obedio/service/request
  6. 📤 Send ACK: obedio/device/TEST-BUTTON-001/command

📡 Listening for acknowledgment...

📥 Received acknowledgment:
Topic: obedio/device/TEST-BUTTON-001/command
Payload: {"command":"ack","requestId":"cuid123","status":"received"}

✅ Button press acknowledged!
Request ID: cuid123
Status: received
```

---

### Step 3: Check Backend Logs

**Backend should show**:
```
📥 MQTT message: obedio/button/TEST-BUTTON-001/press { deviceId: 'TEST-BUTTON-001', ... }
🔘 Button press from TEST-BUTTON-001: { button: 'main', pressType: 'single', ... }
📱 Auto-creating virtual device: TEST-BUTTON-001
✅ Virtual device created: Virtual Button 001
✅ Service request created: cuid123
📤 MQTT published to obedio/service/request: { id: 'cuid123', ... }
📤 MQTT published to obedio/device/TEST-BUTTON-001/command: { command: 'ack', ... }
```

---

## Test 2: Test Different Press Types

```bash
# Single press (normal priority)
node test-button-press.js single

# Double press (urgent priority)
node test-button-press.js double

# Long press (voice recording)
node test-button-press.js long

# Shake (emergency!)
node test-button-press.js shake
```

Each should create service request with different priority!

---

## Test 3: Verify in Database

### Open Prisma Studio

```bash
cd backend
npx prisma studio
```

**Opens**: http://localhost:5555

### Check Tables

**Device Table**:
- Should see: `deviceId = "TEST-BUTTON-001"`
- Type: `smart_button`
- Status: `online`
- Name: `Virtual Button 001`

**ServiceRequest Table**:
- Should see new requests
- Different priorities based on pressType
- Status: `pending`
- Guest: `Guest` (anonymous)

**DeviceLog Table**:
- Should see `eventType = "button_press"`
- eventData contains full button press details

---

## Test 4: Monitor MQTT Messages

### Terminal 1: Subscribe to All Topics

```bash
mosquitto_sub -h localhost -t "obedio/#" -v
```

### Terminal 2: Send Button Press

```bash
node backend/test-button-press.js
```

### Terminal 1: Should See

```
obedio/button/TEST-BUTTON-001/press {"deviceId":"TEST-BUTTON-001",...}
obedio/service/request {"id":"cuid123","location":"Unknown",...}
obedio/device/TEST-BUTTON-001/command {"command":"ack",...}
```

---

## Test 5: Verify in Frontend (Optional)

### Open Frontend

http://localhost:5173

### Login as Admin

### Go to Service Requests Page

**Should see**:
- New service request from "Guest" at "Unknown" location
- Status: Pending
- Priority: Normal (or Urgent/Emergency depending on pressType)

### Open Device Manager

**Should see**:
- Device: TEST-BUTTON-001
- Type: Smart Button
- Status: Online
- Name: Virtual Button 001

### Check Browser Console (F12)

**Should see WebSocket event**:
```javascript
service-request:new {
  id: "cuid123",
  guestName: "Guest",
  status: "pending",
  priority: "normal"
}
```

---

## ✅ Success Criteria

Backend button press handler is working when:

- [x] Test script connects to MQTT ✅
- [x] Test script publishes button press ✅
- [x] Backend receives message ✅
- [x] Backend logs: `🔘 Button press from TEST-BUTTON-001` ✅
- [x] Device auto-created in database ✅
- [x] Service request created in database ✅
- [x] Device log created ✅
- [x] Backend publishes to `obedio/service/request` ✅
- [x] Backend sends ACK to `obedio/device/TEST-BUTTON-001/command` ✅
- [x] Test script receives ACK ✅

---

## 🚀 After Tests Pass

**Next step**: Add button press code to Heltec firmware!

When tests pass, you know backend is ready. Then just upload firmware with button press code and it will work exactly the same way!

---

## 🐛 Troubleshooting

### Test Script Can't Connect to MQTT

**Check Mosquitto**:
```bash
docker ps | grep mosquitto
```

**Should be running on port 1883**

**Restart if needed**:
```bash
docker restart obedio-mosquitto
```

### Backend Doesn't Receive Message

**Check backend MQTT connection**:
Look for: `✅ MQTT connected successfully`

**Check subscriptions**:
Look for: `✅ Subscribed to obedio/button/+/press`

**Restart backend**:
- Ctrl+C
- `npm run dev`

### No ACK Received

**Check backend logs** - did it create service request?

**Check MQTT publish** - is backend publishing?

**Try monitoring**:
```bash
mosquitto_sub -h localhost -t "obedio/device/+/command" -v
```

---

## 📋 Quick Reference Commands

```bash
# Start Mosquitto (if not running)
docker start obedio-mosquitto

# Start backend
cd backend
npm run dev

# Run test
node test-button-press.js

# Monitor MQTT
mosquitto_sub -h localhost -t "obedio/#" -v

# Check database
npx prisma studio

# Check Docker containers
docker ps
```

---

**Ready to test!** 🚀

Run the test script and verify backend handles button presses correctly before uploading to real ESP32!

---

*Last Updated: October 24, 2025*
