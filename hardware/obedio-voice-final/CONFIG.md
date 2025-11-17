# ESP32 Configuration Guide

## ⚠️ MUST CONFIGURE BEFORE UPLOADING

Before uploading this firmware to your ESP32 device, you MUST configure these settings:

### 1. WiFi Settings (Lines 40-41)
```cpp
const char* WIFI_SSID     = "Obedio";  // Your WiFi network name
const char* WIFI_PASSWORD = "BrankomeinBruder:)";  // Your WiFi password
```

### 2. Backend Server (Lines 44-46)
```cpp
const char* BACKEND_HOST = "10.10.0.207";  // Your server IP address
const uint16_t BACKEND_PORT = 8080;  // Backend API port
const char* UPLOAD_ENDPOINT = "/api/transcribe";  // ✅ FIXED
```

### 3. MQTT Broker (Lines 49-50)
```cpp
const char* MQTT_HOST = "10.10.0.207";  // Your MQTT broker IP
const uint16_t MQTT_PORT = 1883;  // MQTT port
```

**Note**: Device location is managed in the backend database via the `devices` table. The ESP32 only needs to know its device ID (auto-generated from MAC address), and the backend will look up which location/cabin it's assigned to.

---

## 🔧 FIXES APPLIED

### Fix #1: Correct API Endpoint
- **Before**: `/api/upload/upload-audio` (does not exist)
- **After**: `/api/transcribe` ✅
- **Line**: 46

### Fix #2: Response JSON Parsing
- **Before**: Expected `{success, data: {audioUrl, translation}}`
- **After**: Expects `{success, transcript, translation, language}` ✅
- **Lines**: 706-728

---

## 📡 MQTT Message Format

When button is pressed, ESP32 publishes to:
```
Topic: obedio/button/{deviceId}/press
```

Payload:
```json
{
  "deviceId": "BTN-24A160FF1234",
  "button": "main",
  "pressType": "long",
  "battery": 100,
  "rssi": -45,
  "firmwareVersion": "v3.0-voice",
  "timestamp": 123456,
  "voiceTranscript": "Please bring water"
}
```

**Note**: Backend will add `locationId` and `guestId` by looking up the device in the database.

---

## 🎤 Voice Recording Flow

1. **Hold T1 button** (>500ms) → Recording starts (blue LED spins)
2. **Release T1** → Recording stops
3. **Upload** → POST to `/api/transcribe` (yellow LED pulse)
4. **Backend** → OpenAI Whisper transcribes + translates
5. **Success** → Green LED flash
6. **Playback** → Recorded audio plays on speaker (cyan LED)
7. **MQTT Publish** → Notification sent to crew watches

---

## 📝 Current Configuration Status

- ✅ WiFi: "Obedio" network
- ✅ Backend: 10.10.0.207:8080
- ✅ MQTT: 10.10.0.207:1883
- ✅ Device ID: Auto-generated from MAC address
- ✅ Location: Managed in backend database

---

## 🚀 Upload Instructions

### Using Arduino IDE:
1. Open `obedio-voice-final.ino`
2. Verify settings above (WiFi, Backend, MQTT are already configured)
3. Select board: **ESP32-S3 Dev Module**
4. Select port: (your ESP32 COM port)
5. Click **Upload**

### Using PlatformIO:
```bash
cd "c:/Users/debra/OneDrive/Desktop/OBEDIO Final/hardware/obedio-voice-final"
pio run --target upload
```

---

## 🧪 Testing

After upload:

1. **Check Serial Monitor** (115200 baud):
   - WiFi connection status
   - MQTT connection status
   - Device ID (BTN-XXXXXX)

2. **Test Single Press** (T1):
   - Short press → Service request
   - Check backend logs for MQTT message

3. **Test Voice Recording** (T1):
   - Hold button >500ms
   - Speak while holding
   - Release → Upload → Playback
   - Check webapp for transcription

4. **Test Aux Buttons** (T2-T5):
   - Each button triggers different LED color
   - MQTT message sent for each

---

## ❌ Troubleshooting

### WiFi Won't Connect
- Check SSID and password
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Check signal strength

### MQTT Connection Failed
- Verify broker IP and port
- Check firewall settings
- Ensure Mosquitto is running

### Upload Fails (HTTP 404)
- ✅ Already fixed - endpoint is now `/api/transcribe`
- Verify backend is running on port 8080

### No Transcription
- Check OpenAI API key in backend/.env
- Test endpoint: `GET http://10.10.0.207:8080/api/transcribe/test`

---

**Last Updated**: 2025-11-16 (MetsTrade Sprint)
**Firmware Version**: v3.0-voice-fixed
