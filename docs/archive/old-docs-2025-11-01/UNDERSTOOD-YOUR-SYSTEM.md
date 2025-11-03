# What I Now Understand About Your System

## ✅ After Reading Your Code

### MQTT Topics (Already Implemented):
```
obedio/button/{deviceId}/press     → Button press events
obedio/button/{deviceId}/status    → Device status (battery, RSSI)
obedio/device/{deviceId}/telemetry → Telemetry data
obedio/device/{deviceId}/command   → Commands from server→device
obedio/service/request             → Service requests (for watches)
obedio/service/update              → Status updates
```

### Button Press Message Format:
```json
{
  "deviceId": "BTN-MASTER-SUITE",
  "locationId": "cmh4h002y0007j719kfak6h6t",
  "guestId": "cmh4h003n000sj719oz4tkvxl",
  "priority": "normal|urgent|emergency",
  "type": "call",
  "notes": "Service requested",
  "timestamp": "2025-10-24T12:34:56Z"
}
```

### Service Request to Watch:
```json
{
  "id": "req_123",
  "location": "Master Bedroom",
  "guest": "Leonardo DiCaprio",
  "priority": "urgent",
  "timestamp": "2025-10-24T12:34:56Z"
}
```

### Button Behavior (from button-simulator):
- **Tap:** Normal service call
- **Hold 500ms+:** Voice recording starts
- **Shake:** Emergency call (priority="emergency")
- **Aux buttons:** Customizable (DND, Lights, Food, Drinks)

### Voice Recording Flow:
1. Button pressed & held → Wake from deep sleep
2. Turn on WiFi (if not already on)
3. Start recording
4. Guest talks
5. Release button
6. Upload audio → `POST /api/transcribe`
7. OpenAI Whisper translates → English
8. Create service request with transcript

### Emergency Shake-to-Call:
- Priority: "emergency"
- Shows: Location + Guest + **MEDICAL INFO** ⚠️
- Sound: Siren (800-1200Hz sweep)
- Vibration: Pattern [200, 100, 200, 100, 200]
- Display: Allergies, Medical Conditions, Emergency Contact

### T-Watch Requirements:
- Receive service requests via MQTT
- Show: Location, Guest, Priority, Message
- Actions: **Accept** or **Delegate**
- Delegate → Show crew list to select
- Emergency → **HAPTICS + SOUND CRITICAL**
- Also receive: Messages from web app crew page

## What I'm Creating Now:

### 1. Heltec V3 LoRa Button Firmware (Arduino)
- **WiFi only** (for Nov 20 demo)
- MQTT client → connects to mosquitto
- Single/Double/Long press detection
- NO microphone (you confirmed)
- Just creates service request when pressed
- Battery monitoring
- Deep sleep

### 2. LilyGo T-Watch S3 Firmware (Arduino)
- MQTT client → receives service requests
- UI: Option B (detailed view)
- Actions: Accept / Delegate (shows crew list)
- **HAPTICS critical** ✅
- **SOUND critical** ✅
- Emergency: Loud vibrate + beep
- Also receives messages from web app

## Deleted:
❌ `firmware/esp32-smart-button/` - Generic ESP32 firmware (useless for you)

## Creating:
✅ `firmware/heltec-v3-button/` - YOUR button firmware
✅ `firmware/lilygo-twatch-s3/` - YOUR watch firmware

Ready to proceed?
