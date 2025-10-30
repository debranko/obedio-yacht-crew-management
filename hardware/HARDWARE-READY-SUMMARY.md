# OBEDIO Hardware - Connection Test Ready! 🚀

**Status**: Ready to upload firmware and test real ESP32 devices

**Date**: October 24, 2025

---

## ✅ What Has Been Completed

### 1. **Heltec WiFi LoRa 32 V3 Firmware** ✅
**File**: `hardware/heltec-minimal/heltec-minimal.ino`

**What it does**:
- Connects to WiFi (Blagojevic)
- Connects to MQTT broker (192.168.5.152:1883)
- Generates device ID from MAC address (e.g., HELTEC-A1B2C3D4E5F6)
- Registers with backend via MQTT
- Sends heartbeat every 30 seconds
- Shows status on OLED display

**Features**:
- ✅ WiFi connection with auto-reconnect
- ✅ MQTT connection with auto-reconnect
- ✅ Device registration (auto-creates in database)
- ✅ Heartbeat keepalive
- ✅ OLED display shows connection status
- ✅ Serial debug output
- ✅ Built-in button on GPIO0 (ready for future use!)
- ✅ Battery monitoring on GPIO1 (ready for future use!)
- ✅ LED control on GPIO35 (ready for future use!)

**Display shows**:
```
✓ REGISTERED

Heltec Dev Button
ID: HELTEC-A1B2C3...

WiFi: -45dBm
```

---

### 2. **LilyGO T-Watch S3 Firmware** ✅
**File**: `hardware/twatch-minimal/twatch-minimal.ino`

**What it does**:
- Connects to WiFi (Blagojevic)
- Connects to MQTT broker (192.168.5.152:1883)
- Generates device ID from MAC address (e.g., TWATCH-F6E5D4C3B2A1)
- Registers with backend via MQTT (type: "wearable")
- Sends heartbeat every 30 seconds
- Shows status on color display

**Features**:
- ✅ WiFi connection with auto-reconnect
- ✅ MQTT connection with auto-reconnect
- ✅ Device registration (auto-creates in database)
- ✅ Heartbeat keepalive
- ✅ 240x240 color display with status
- ✅ Serial debug output
- ✅ Uptime counter on display

**Display shows**:
```
✓ REGISTERED

T-Watch Dev
ID: TWATCH-F6E5D4...

WiFi: -50dBm
Status: Online
Uptime: 120s
```

---

### 3. **Backend Auto-Registration** ✅
**File**: `backend/src/services/mqtt.service.ts`

**New Features Added**:

#### Device Registration Handler
- Subscribes to: `obedio/device/register`
- Receives device info: deviceId, type, name, firmwareVersion, hardwareVersion, macAddress, ipAddress, rssi
- **Auto-creates** Device record in PostgreSQL database
- Updates existing device if already registered
- Creates device log entry
- Sends confirmation back to device
- Emits WebSocket event to frontend

#### Device Heartbeat Handler
- Subscribes to: `obedio/device/heartbeat`
- Updates device status to "online"
- Updates lastSeen timestamp
- Updates signal strength (RSSI)
- Auto-registers if device not found
- Keeps MQTT monitor updated

**MQTT Topics**:
```
✅ obedio/device/register   - Device registration
✅ obedio/device/heartbeat  - Keepalive messages
```

---

### 4. **Arduino Setup Guide** ✅
**File**: `hardware/ARDUINO-SETUP-GUIDE.md`

**Complete instructions for**:
- Installing Arduino IDE 2.x
- Installing ESP32 board support
- Installing required libraries (Heltec, TFT_eSPI, PubSubClient, ArduinoJson)
- Configuring Heltec WiFi LoRa 32 V3
- Configuring LilyGO T-Watch S3
- Uploading firmware to both devices
- Monitoring serial output
- Troubleshooting common issues
- Verifying devices in Device Manager

---

## 📋 Hardware Specifications Documented

### Heltec WiFi LoRa 32 V3

**MCU**: ESP32-S3FN8 (8MB Flash)

**Key Pins**:
- **OLED Display**: GPIO17 (SDA), GPIO18 (SCL), GPIO21 (RST)
- **LoRa Module**: GPIO8-14 (not used yet)
- **Built-in Button**: GPIO0 (USER_SW) ⚡ Ready to use!
- **Battery Monitor**: GPIO1 (VBAT_Read) ⚡ Ready to use!
- **LED**: GPIO35 (White LED) ⚡ Ready to use!
- **Vext Control**: GPIO36 (external peripherals)

**Power**:
- USB Type-C (5V)
- LiPo battery (JST 1.25mm connector)
- Battery charging via LGS4056HDA

### LilyGO T-Watch S3

**MCU**: ESP32-S3 with PSRAM

**Features**:
- 240x240 color touchscreen
- Built-in sensors
- Speaker and microphone
- Vibration motor
- Battery management

---

## 🎯 What Happens When You Upload

### Upload Flow:

1. **Upload firmware via Arduino IDE** (USB cable)
   ↓
2. **Device boots and connects to WiFi** (Blagojevic)
   ↓
3. **Device connects to MQTT broker** (192.168.5.152:1883)
   ↓
4. **Device publishes registration message**
   ```
   Topic: obedio/device/register
   Payload: {
     deviceId: "HELTEC-A1B2C3D4E5F6",
     type: "smart_button",
     name: "Heltec Dev Button",
     firmwareVersion: "v0.1-minimal",
     hardwareVersion: "Heltec WiFi LoRa 32 V3",
     macAddress: "A1:B2:C3:D4:E5:F6",
     ipAddress: "192.168.5.123",
     rssi: -45
   }
   ```
   ↓
5. **Backend receives registration**
   - Creates Device record in database
   - Logs device creation
   - Updates MQTT monitor
   - Sends confirmation to device
   - Emits WebSocket event
   ↓
6. **Device appears in Device Manager** (frontend)
   - Shows as "Online"
   - Shows all details (IP, signal, firmware, etc.)
   - Ready to assign to location/crew member
   ↓
7. **Device sends heartbeat every 30 seconds**
   - Keeps status updated
   - Shows device is alive

---

## 🚀 Next Steps - What YOU Need to Do

### Step 1: Install Arduino IDE and Libraries

Follow: [ARDUINO-SETUP-GUIDE.md](./ARDUINO-SETUP-GUIDE.md)

**Time**: ~15 minutes

**What to install**:
- Arduino IDE 2.x
- ESP32 board support
- Heltec ESP32 library
- TFT_eSPI library
- PubSubClient library
- ArduinoJson library

---

### Step 2: Upload Heltec Firmware

**File**: `hardware/heltec-minimal/heltec-minimal.ino`

1. Open file in Arduino IDE
2. Select board: **WiFi LoRa 32(V3)**
3. Select port: **COMx** (your USB port)
4. Click **Upload** button
5. Open **Serial Monitor** (115200 baud)
6. Watch connection process

**Expected Serial Output**:
```
========================================
OBEDIO - Heltec Minimal Connection Test
========================================

Device ID: HELTEC-XXXXXXXXXXXX
Device Type: smart_button
Firmware: v0.1-minimal

🔌 Connecting to WiFi...
SSID: Blagojevic
✅ WiFi connected!
IP Address: 192.168.5.XXX

🔌 Connecting to MQTT broker...
Broker: 192.168.5.152:1883
✅ MQTT connected!

📤 Registering device with backend...
Payload: {"deviceId":"HELTEC-...","type":"smart_button",...}
✅ Registration message sent!

✅ Setup complete! Device is connected.

💓 Heartbeat sent (uptime: 30s)
💓 Heartbeat sent (uptime: 60s)
```

**Check OLED**: Should show "✓ REGISTERED"

---

### Step 3: Upload T-Watch Firmware

**File**: `hardware/twatch-minimal/twatch-minimal.ino`

1. Open file in Arduino IDE
2. Select board: **ESP32S3 Dev Module**
3. Configure settings (see guide)
4. Select port: **COMx** (your USB port)
5. Click **Upload** button
6. Open **Serial Monitor** (115200 baud)
7. Watch connection process

**Expected Serial Output**: Similar to Heltec

**Check Display**: Should show "✓ REGISTERED" with color

---

### Step 4: Verify in Device Manager

1. Make sure backend is running:
   ```bash
   docker ps
   ```

2. Open web app: http://localhost:5173

3. Login as admin

4. Go to **Device Manager** page

5. **You should see BOTH devices**:

   **Heltec Device**:
   - Device ID: HELTEC-XXXXXXXXXXXX
   - Name: Heltec Dev Button
   - Type: Smart Button
   - Status: 🟢 Online
   - Hardware: Heltec WiFi LoRa 32 V3
   - Firmware: v0.1-minimal
   - IP: 192.168.5.XXX
   - Signal: -XX dBm
   - Last Seen: Just now

   **T-Watch Device**:
   - Device ID: TWATCH-XXXXXXXXXXXX
   - Name: T-Watch Dev
   - Type: Wearable
   - Status: 🟢 Online
   - Hardware: LilyGO T-Watch S3
   - Firmware: v0.1-minimal
   - IP: 192.168.5.XXX
   - Signal: -XX dBm
   - Last Seen: Just now

---

### Step 5: Check Backend Logs

```bash
docker logs obedio-backend-1 -f
```

**You should see**:
```
✅ MQTT connected successfully
✅ Subscribed to obedio/device/register
✅ Subscribed to obedio/device/heartbeat
📱 Device registration: { deviceId: 'HELTEC-...' ... }
➕ Creating new device: HELTEC-XXXXXXXXXXXX
✅ Device created: Heltec Dev Button
📱 Device registration: { deviceId: 'TWATCH-...' ... }
➕ Creating new device: TWATCH-XXXXXXXXXXXX
✅ Device created: T-Watch Dev
💓 Heartbeat from HELTEC-... (every 30s)
💓 Heartbeat from TWATCH-... (every 30s)
```

---

### Step 6: Test Assignment (Optional)

Once devices are visible:

**Assign Heltec to Location**:
1. Go to Device Manager
2. Click on Heltec device
3. Click "Assign"
4. Select a location (e.g., "Guest Cabin 1")
5. Click "Save"

**Assign T-Watch to Crew Member**:
1. Go to Device Manager
2. Click on T-Watch device
3. Click "Assign"
4. Select a crew member (e.g., "Emily Chen")
5. Click "Save"

---

## 🐛 Troubleshooting

### Devices Don't Appear in Device Manager

**Check 1**: Backend MQTT is connected
```bash
docker logs obedio-backend-1 | grep "MQTT connected"
```
Should see: `✅ MQTT connected successfully`

**Check 2**: Backend subscribed to topics
```bash
docker logs obedio-backend-1 | grep "Subscribed"
```
Should see:
```
✅ Subscribed to obedio/device/register
✅ Subscribed to obedio/device/heartbeat
```

**Check 3**: Device registration message received
```bash
docker logs obedio-backend-1 | grep "Device registration"
```
Should see: `📱 Device registration: { deviceId: 'HELTEC-...' ... }`

**Check 4**: Mosquitto is running
```bash
docker ps | grep mosquitto
```

**Fix**: Restart backend
```bash
docker restart obedio-backend-1
```

### WiFi Connection Fails

- Check SSID is exactly: `Blagojevic`
- Check password is exactly: `Lozinka12!`
- Make sure WiFi is 2.4GHz (not 5GHz)
- Move device closer to router

### MQTT Connection Fails

- Check broker IP: `192.168.5.152`
- Ping server: `ping 192.168.5.152`
- Check Mosquitto: `docker ps | grep mosquitto`
- Check port: `telnet 192.168.5.152 1883`

---

## 📊 System Status Check

Before uploading firmware, verify:

- [ ] Docker containers running (`docker ps`)
- [ ] Mosquitto container running
- [ ] Backend container running
- [ ] Backend MQTT connected (check logs)
- [ ] Frontend running (http://localhost:5173)
- [ ] WiFi SSID "Blagojevic" is active
- [ ] Server IP 192.168.5.152 is accessible

---

## 🎉 Success Criteria

**You'll know everything works when**:

1. ✅ Heltec OLED shows "✓ REGISTERED"
2. ✅ T-Watch display shows "✓ REGISTERED"
3. ✅ Serial Monitor shows heartbeat messages every 30s
4. ✅ Device Manager shows both devices as "Online"
5. ✅ Backend logs show registration messages
6. ✅ You can assign devices to locations/crew

---

## 📝 What's NOT Implemented Yet

This is **minimal connection-only firmware**. Not yet implemented:

- ❌ Button press handling
- ❌ Service request creation from button
- ❌ Notification display on T-Watch
- ❌ ACCEPT/DELEGATE buttons on T-Watch
- ❌ "Accepted" feedback on Heltec
- ❌ Location name display from database
- ❌ Avatar/image display
- ❌ Audio alerts
- ❌ Vibration patterns
- ❌ Battery level reporting
- ❌ Multiple buttons per location
- ❌ ETO permission checks

**Current goal**: Just get devices to CONNECT and appear in Device Manager! 🎯

---

## 🔮 After Connection Works

Once you verify both devices appear in Device Manager, we can add:

1. **Button Press** - Use built-in GPIO0 button on Heltec
2. **Service Request** - Create request when button pressed
3. **T-Watch Notification** - Show request on T-Watch display
4. **Accept Button** - Crew accepts request on T-Watch
5. **Feedback** - Heltec shows "Accepted" on OLED
6. **Location Name** - Load from database and display
7. **Battery Monitoring** - Read GPIO1 on Heltec
8. **LED Feedback** - Control GPIO35 LED on Heltec

But first... **LET'S GET THEM CONNECTED!** 🚀

---

## 📞 Ready to Start?

1. Read: [ARDUINO-SETUP-GUIDE.md](./ARDUINO-SETUP-GUIDE.md)
2. Install Arduino IDE and libraries (~15 min)
3. Upload Heltec firmware (~5 min)
4. Upload T-Watch firmware (~5 min)
5. Check Device Manager - see your devices! 🎉

**Total time**: ~30 minutes from zero to seeing devices online

---

**Good luck! Srećno!** 🚀

When devices appear in Device Manager, you'll have successfully integrated REAL ESP32 hardware with the OBEDIO system for the METSTRADE demo!

---

*Last Updated: October 24, 2025*
*OBEDIO Development Team*
