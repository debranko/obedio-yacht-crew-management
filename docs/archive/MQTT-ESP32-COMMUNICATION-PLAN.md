# MQTT & ESP32 Communication Plan - Simple Explanation 🚢

## Overview - What We're Building

Think of this like setting up a **smart intercom system** for the yacht where:
- Each ESP32 button is like a smart doorbell
- MQTT is the communication network (like the ship's radio system)
- OBEDIO server is the main control center
- Device Manager is the control panel for all devices

## How It Works (Like a Ship's Radio System)

### 1. **MQTT Broker = Central Radio Tower** 📡
- Runs on port 1883
- All devices connect here to talk to each other
- Like having a central radio repeater on the yacht

### 2. **MQTT Monitor = Control Room Screen** 🖥️
- Separate webpage on port 8888
- Shows ALL device conversations in real-time
- Like having a technician's diagnostic screen

### 3. **Communication Channels (Topics)**
Just like marine radio channels, we have different channels for different purposes:

```
Channel 1: obedio/button/BTN-001/press     → "Someone pressed button BTN-001!"
Channel 2: obedio/button/BTN-001/status    → "BTN-001 battery is at 85%"
Channel 3: obedio/device/BTN-001/command   → "Hey BTN-001, flash your lights!"
Channel 4: obedio/device/BTN-001/telemetry → "BTN-001 temperature: 25°C"
```

## What Happens When Guest Presses Button

```
1. Guest presses ESP32 button in Master Cabin
   ↓
2. Button sends message: "Button pressed at Master Cabin!"
   ↓
3. MQTT Broker receives and forwards message
   ↓
4. OBEDIO Server receives message
   ↓
5. Server creates service request
   ↓
6. Crew gets notification on their device
   ↓
7. Server tells button: "Got it! Flash green LED"
   ↓
8. Button flashes green to confirm
```

## Device Manager Functions

### 1. **Discovery & Pairing** 🔍
- New ESP32 turns on → "Hello, I'm BTN-NEW-001!"
- Shows up in Device Manager → "New device found!"
- You assign it to a location → "This is the Master Cabin button"

### 2. **Real-Time Control** 🎮
- **Test Button**: Click to make device beep, flash, vibrate
- **Configure**: Change LED colors, sound volume, button sensitivity
- **Monitor**: See battery %, signal strength, online/offline status

### 3. **Two-Way Communication** ↔️
```
OBEDIO → ESP32: "Flash your LED green and beep twice"
ESP32 → OBEDIO: "Guest pressed button, battery at 75%"
```

## What ESP32 Firmware Must Do

The ESP32 code (we'll create later) needs to:

### 1. **Connect to Network**
```
- Connect to yacht WiFi
- Connect to MQTT broker
- Announce itself: "BTN-001 is online!"
```

### 2. **Listen for Commands**
```
Subscribe to: obedio/device/BTN-001/command
When receives: {"command": "test", "led": true, "sound": true}
Then: Flash LED and make sound
```

### 3. **Send Events**
```
When button pressed → Send to: obedio/button/BTN-001/press
Every 5 minutes → Send to: obedio/button/BTN-001/status
```

## MQTT Monitor Dashboard Features

Access at: `http://localhost:8888`

- **Live Message View**: See all messages as they happen
- **Device List**: Shows all connected devices with status
- **Filter**: Search for specific devices or message types
- **Export**: Download logs for troubleshooting

## Why This Design?

### ✅ **Instant Communication**
- Press button → Notification in < 100ms
- No delays, no polling, instant updates

### ✅ **Reliable**
- Works on local network (no internet needed)
- Automatically reconnects if connection drops
- Knows immediately if device goes offline

### ✅ **Scalable**
- Can handle 100+ devices easily
- Add new devices without changing code
- Each device is independent

### ✅ **Debuggable**
- MQTT Monitor shows everything
- Can simulate button presses from web
- Easy to test without physical devices

## Next Steps

### 1. **Device Manager UI** (Next Task)
- Grid view of all devices
- Click device to see details
- Test buttons for each device
- Assign devices to yacht locations

### 2. **ESP32 Firmware** (Later)
```c
// Simplified ESP32 code structure:
1. Connect to WiFi
2. Connect to MQTT
3. Subscribe to command channel
4. Listen for button press
5. Send MQTT message when pressed
6. Listen for LED/sound commands
7. Send battery status every 5 min
```

### 3. **Testing Flow**
1. Use Button Simulator in web app
2. Watch messages in MQTT Monitor
3. See service request created
4. Test with real ESP32 later

## Summary for Non-Programmers

Think of it like this:
- **MQTT** = The yacht's internal phone/radio system
- **ESP32 Buttons** = Smart call buttons in each cabin
- **OBEDIO Server** = The main reception desk
- **Device Manager** = Control panel for all buttons
- **MQTT Monitor** = Technician's diagnostic screen

When a guest presses a button:
1. Button calls the main desk
2. Main desk creates a service request
3. Notifies the right crew member
4. Tells button "message received" (green light)

Everything happens instantly and you can watch it all happen in real-time on the monitor screen!

---

**Is this the kind of real-time device control you were envisioning?** 🚀