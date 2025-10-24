# 📡 ESP32 Smart Button Firmware Specification

## Overview

The OBEDIO ESP32 Smart Button is a custom-designed IoT device that serves as the primary interface between yacht guests and the crew service system. This document specifies the exact firmware behavior, MQTT topics, and communication protocols.

## Hardware Specifications

### Custom PCB Design (NOT Heltec!)
```
┌─────────────────────────────────────────┐
│          OBEDIO SMART BUTTON V2         │
│                                         │
│      [AUX1]              [AUX2]        │
│        ●                   ●           │
│                                        │
│           ┌─────────────┐              │
│           │   MAIN BTN  │              │
│           │  (TOUCH)    │              │
│           │      ⚪     │              │
│           └─────────────┘              │
│                                        │
│      [AUX3]              [AUX4]        │
│        ●                   ●           │
│                                        │
│    [LED RING - 12 RGB LEDs]           │
└─────────────────────────────────────────┘
```

### Components:
- **MCU**: ESP32-WROOM-32 (Dual-core, WiFi, BLE)
- **Main Button**: Capacitive touch sensor (2.5cm diameter)
- **Aux Buttons**: 4x Tactical switches (6mm)
- **LED Ring**: 12x WS2812B RGB LEDs
- **Audio**: I2S MEMS Microphone + Small speaker
- **Sensors**: MPU6050 (Accelerometer for shake detection)
- **Power**: 18650 Li-ion battery (2600mAh)
- **Charging**: USB-C with charge controller
- **Antenna**: External 2.4GHz for better range

## Firmware Architecture

### Core Features

1. **WiFi Connection Manager**
   - Auto-connect to yacht network
   - Fallback AP mode for configuration
   - mDNS for easy discovery

2. **MQTT Client**
   - Persistent connection to broker
   - QoS 1 for all messages (at least once delivery)
   - Auto-reconnect with exponential backoff
   - Message queue for offline operation

3. **Button Handler**
   - Debouncing (50ms)
   - Multi-press detection
   - Long press detection (>500ms)
   - Gesture recognition

4. **Power Management**
   - Deep sleep when idle
   - Wake on button press
   - Battery monitoring
   - Low battery warnings

## MQTT Topics & Payloads

### 1. Button Press Events

**Topic**: `obedio/button/{deviceId}/press`

**Payload**:
```json
{
  "deviceId": "BTN-D4:CA:6E:11:22:33",
  "locationId": "e5f7a281-3a54-4e89-b723-7c2e9f8d1234",
  "guestId": "g7h8i9j0-1234-5678-90ab-cdef12345678",
  "pressType": "single|double|long|shake",
  "button": "main|aux1|aux2|aux3|aux4",
  "timestamp": "2025-10-24T09:00:00.000Z",
  "battery": 85,
  "rssi": -45,
  "firmwareVersion": "2.1.0",
  "sequenceNumber": 1234
}
```

### 2. Device Status (Heartbeat)

**Topic**: `obedio/button/{deviceId}/status`

**Payload** (every 60 seconds):
```json
{
  "deviceId": "BTN-D4:CA:6E:11:22:33",
  "online": true,
  "battery": 85,
  "rssi": -45,
  "uptime": 3600,
  "freeHeap": 145632,
  "temperature": 24.5,
  "firmwareVersion": "2.1.0",
  "ipAddress": "192.168.1.123",
  "timestamp": "2025-10-24T09:00:00.000Z"
}
```

### 3. Voice Message

**Topic**: `obedio/button/{deviceId}/voice`

**Payload**:
```json
{
  "deviceId": "BTN-D4:CA:6E:11:22:33",
  "locationId": "e5f7a281-3a54-4e89-b723-7c2e9f8d1234",
  "guestId": "g7h8i9j0-1234-5678-90ab-cdef12345678",
  "duration": 3.5,
  "format": "opus",
  "sampleRate": 16000,
  "audioData": "base64_encoded_audio_data...",
  "timestamp": "2025-10-24T09:00:00.000Z"
}
```

### 4. Telemetry Data

**Topic**: `obedio/device/{deviceId}/telemetry`

**Payload** (every 5 minutes):
```json
{
  "deviceId": "BTN-D4:CA:6E:11:22:33",
  "battery": 85,
  "voltage": 3.92,
  "current": 45,
  "rssi": -45,
  "channel": 6,
  "txPower": 20,
  "errorCount": 0,
  "bootCount": 12,
  "lastError": "none",
  "timestamp": "2025-10-24T09:00:00.000Z"
}
```

### 5. Command Reception (Subscribe)

**Topic**: `obedio/device/{deviceId}/command`

**Expected Commands**:
```json
{
  "command": "ack|ring|config|update|reboot|test",
  "parameters": {
    "requestId": "req_123456",
    "pattern": "success|error|warning",
    "duration": 1000,
    "color": "#00FF00"
  }
}
```

## Button Behavior Specification

### Main Button (Touch)

| Action | Duration | LED Feedback | MQTT Message | Sound |
|--------|----------|--------------|--------------|-------|
| Single Tap | < 500ms | Green pulse | `pressType: "single"` | Beep |
| Double Tap | 2x < 300ms | Blue pulse x2 | `pressType: "double"` | Beep-beep |
| Long Press | > 500ms | Red breathing | Start voice recording | Tone |
| Release | - | Green flash | Send voice message | Chime |

### Aux Buttons

| Button | Function | LED Pattern | Notes |
|--------|----------|-------------|-------|
| AUX1 (Top-Left) | Toggle DND | Orange/Off | Direct toggle |
| AUX2 (Top-Right) | Lights Control | White flash | Crestron integration |
| AUX3 (Bottom-Left) | Food Service | Green pulse | "Prepare meal" |
| AUX4 (Bottom-Right) | Drink Service | Blue pulse | "Bring drinks" |

### Shake Detection

**Threshold**: 2.5G acceleration
**Duration**: 500ms sustained
**Cooldown**: 5 seconds
**Action**: Emergency call with `priority: "emergency"`

## Connection Flow

```
1. POWER ON
   └─> Check saved WiFi credentials
       ├─> Found: Connect to WiFi
       └─> Not Found: Start AP mode "OBEDIO-BTN-XXXX"

2. WIFI CONNECTED
   └─> Connect to MQTT broker
       ├─> Success: Subscribe to command topic
       └─> Fail: Retry with backoff (1s, 2s, 4s... max 60s)

3. MQTT CONNECTED
   └─> Send status message
   └─> Start heartbeat timer (60s)
   └─> Enable deep sleep after 30s idle

4. BUTTON PRESS (Wake from sleep)
   └─> Reconnect if needed (usually < 200ms)
   └─> Send press message
   └─> Visual/audio feedback
   └─> Return to idle
```

## Power Management

### Battery Life Targets
- **Standby**: 6 months (deep sleep)
- **Active Use**: 2 weeks (50 presses/day)
- **Heavy Use**: 1 week (200 presses/day)

### Sleep Modes
1. **Active**: Full power, all features (30s after press)
2. **Light Sleep**: WiFi on, CPU throttled (30s-5min)
3. **Deep Sleep**: Only RTC, wake on button (>5min idle)

### Low Battery Behavior
- **< 20%**: Yellow LED pulse every 30s
- **< 10%**: Red LED pulse every 10s
- **< 5%**: Disable non-essential features

## Configuration

### Initial Setup (AP Mode)
```
SSID: OBEDIO-BTN-XXXX
Password: obedio2025
Config URL: http://192.168.4.1

Settings:
- WiFi SSID & Password
- MQTT Broker IP
- Location Assignment
- Button Functions
- LED Brightness
- Sound Volume
```

### Runtime Configuration (via MQTT)
```json
{
  "command": "config",
  "parameters": {
    "ledBrightness": 50,
    "soundEnabled": true,
    "soundVolume": 70,
    "shakeThreshold": 2.5,
    "deepSleepDelay": 30,
    "heartbeatInterval": 60,
    "buttonFunctions": {
      "aux1": "dnd",
      "aux2": "lights",
      "aux3": "food",
      "aux4": "drinks"
    }
  }
}
```

## Security

### Authentication
- **WiFi**: WPA2-PSK required
- **MQTT**: Username/password optional
- **OTA Updates**: Signed firmware only

### Encryption
- **WiFi**: WPA2 encryption
- **MQTT**: TLS optional (yacht network)
- **Audio**: Opus compression

## Virtual Button Simulator Alignment

The web-based button simulator MUST exactly replicate this behavior:

1. **Same MQTT topics** - No variations
2. **Same payload structure** - Every field
3. **Same timing** - Debounce, long press detection
4. **Same feedback** - Visual representation of LEDs
5. **Same audio** - Play button sounds

### Simulator-Specific Requirements
```typescript
// Virtual button must send EXACTLY this structure
const buttonPress = {
  deviceId: selectedLocation.smartButtonId || `BTN-${locationId.slice(-8)}`,
  locationId: location.id,
  guestId: guest?.id || null,
  pressType: getPressType(duration, clickCount),
  button: "main", // or aux1-4
  timestamp: new Date().toISOString(),
  battery: 100, // Simulator always full
  rssi: -40, // Simulator always good signal
  firmwareVersion: "2.1.0-sim",
  sequenceNumber: sequence++
};

mqttClient.publish(`obedio/button/${deviceId}/press`, buttonPress);
```

## Testing & Validation

### Firmware Test Cases
1. ✅ Cold boot → WiFi → MQTT → Ready < 3 seconds
2. ✅ Deep sleep → Wake → Send message < 200ms  
3. ✅ 1000 button presses without crash
4. ✅ 24-hour continuous operation
5. ✅ Recover from WiFi loss
6. ✅ Recover from MQTT disconnect
7. ✅ Queue messages when offline
8. ✅ Low battery operation

### Production Requirements
- **Reliability**: 99.9% message delivery
- **Latency**: < 500ms button to server
- **Battery**: 2-week minimum
- **Range**: 30m through yacht walls
- **Durability**: Marine environment rated

## Future Enhancements (Post-METSTRADE)

1. **LoRa Support** - For larger yachts
2. **Mesh Networking** - Button-to-button relay
3. **BLE Integration** - Direct to crew phones
4. **AI Voice** - Local wake word detection
5. **Haptic Feedback** - Vibration motor
6. **E-Ink Display** - Status/menu display

---

**This specification is the SINGLE SOURCE OF TRUTH for ESP32 firmware development. Any deviation requires written approval.**

*Version: 2.1.0*
*Last Updated: October 24, 2025*
*Target: METSTRADE 2025*