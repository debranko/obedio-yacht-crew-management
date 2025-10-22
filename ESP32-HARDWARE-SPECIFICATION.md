# ESP32 HARDWARE SPECIFICATION FOR OBEDIO

## 1. SMARTWATCH FOR CREW - LilyGo T-Watch S3

**Device:** https://lilygo.cc/products/t-watch-s3
**Purpose:** Crew receives and manages service requests

### Hardware Specs:
- **MCU:** ESP32-S3 dual-core 240MHz
- **Display:** 1.54" IPS touchscreen (240x240)
- **RAM:** 16MB PSRAM
- **Flash:** 16MB
- **Sensors:**
  - Accelerometer (for shake detection)
  - RTC for accurate time
  - Touch screen
- **Connectivity:** WiFi + BLE 5.0
- **Battery:** 450mAh Li-Po
- **Extras:** Vibration motor, speaker

### Firmware Features:
```
1. MAIN SCREEN:
   - Incoming requests list
   - Active requests count
   - DND rooms indicator
   - Current time & battery

2. REQUEST NOTIFICATION:
   - Vibration alert
   - Sound notification
   - Screen lights up
   - Shows: Location + Request type

3. QUICK ACTIONS:
   - Tap to Accept request
   - Swipe to view details
   - Hold to Complete
   - Double tap to Call backup

4. CREW FEATURES:
   - Shift timer
   - Break reminders
   - Request history
   - Performance stats

5. GESTURES:
   - Swipe left: Active requests
   - Swipe right: History
   - Swipe down: Settings
   - Shake: Emergency alert
```

## 2. SMART BUTTON FOR GUESTS - Heltec WiFi LoRa 32 V3

**Device:** https://heltec.org/project/wifi-lora-32-v3/
**Purpose:** Guests press button to request service

### Hardware Specs:
- **MCU:** ESP32-S3FN8 (Xtensa 32-bit LX7 dual-core)
- **Flash:** 8MB
- **RAM:** 512KB SRAM
- **LoRa:** SX1262 chip (for future use)
- **Display:** 0.96" OLED (128x64)
- **WiFi:** 802.11 b/g/n
- **Bluetooth:** BLE 5.0
- **Frequency:** 863-928MHz (region dependent)
- **Antenna:** Spring antenna + U.FL connector
- **Power:** Li-Po battery support with charging

### Firmware Features:
```
1. SIMPLE BUTTON MODE (for METSTRADE):
   - Single press: Send service request
   - LED feedback: Blue flash = sent
   - Display: "Request Sent"
   - That's it! Keep it simple.

2. FUTURE BUTTON MODES (post-METSTRADE):
   - Double press: Cancel request
   - Long press: Toggle DND
   - Triple press: Emergency
   - Hold 5s: Pairing mode

3. DISPLAY SHOWS:
   - Location name (e.g., "Master Suite")
   - Status (Idle/Request Sent/DND)
   - Battery icon
   - WiFi signal strength

4. LED INDICATORS:
   - Green: Idle/Ready
   - Blue: Request sent
   - Yellow: Request in progress
   - Red: DND active
   - Flashing red: Low battery

5. CONNECTIVITY (METSTRADE):
   - WiFi only
   - Simple HTTP POST to server
   - No LoRa/mesh for demo
```

## 3. REPEATER - LilyGo T3S3 V1.0 (Post-METSTRADE)

**Device:** https://lilygo.cc/products/t3s3-v1-0

### Hardware Specs:
- **MCU:** ESP32-S3 dual-core
- **Display:** Optional e-ink
- **Flash:** 16MB
- **RAM:** 8MB PSRAM
- **Power:** 18650 battery holder
- **Connectivity:** WiFi + Bluetooth 5.0
- **Expansion:** Multiple GPIO pins

### Repeater Features:
```
1. MODES:
   - Bridge mode (WiFi extender)
   - Mesh node (ESP-NOW)
   - Failover server (emergency)
   - Gateway (WiFi to LoRa)

2. CAPABILITIES:
   - 50+ connected devices
   - Local request queue (1000+)
   - Auto-sync when server online
   - Power backup via 18650

3. STATUS INDICATORS:
   - Server connection
   - Active devices count
   - Queue status
   - Battery level

NOTE: Implementation planned POST-METSTRADE
Initial deployment will use WiFi-only mode
```

## 4. CRESTRON INTEGRATION (Future)

### Crestron RMC3 Control:
```javascript
// API endpoint for Crestron commands
POST /api/crestron/control
{
  "room": "master-suite",
  "command": "lights",
  "action": "off",
  "device_id": "BTN_001"
}

// Integration flow:
Button Press → Server → Crestron API → RMC3 → Lights
```

### Planned Crestron Features:
- Lighting scenes
- Climate control
- Blinds/curtains
- Audio/video control
- Security systems

## 5. FIRMWARE ARCHITECTURE

### Common Base Features:
```c
// WiFi Manager
- Auto-connect to saved networks
- Captive portal for setup
- Multiple SSID support

// OTA Updates
- Secure firmware updates
- Version checking
- Rollback support

// Power Management
- Deep sleep modes
- Wake on button/motion
- Battery optimization

// Communication Protocol
- MQTT for real-time
- REST API fallback
- Binary protocol for LoRa
```

### Button Specific:
```c
// LoRa Mesh Network
- ESP-NOW for local mesh
- LoRa for long-range
- Automatic routing
- Message queuing

// Display Driver
- OLED SSD1306
- Low power mode
- Status icons
- Scrolling text
```

### Watch Specific:
```c
// Touch UI Framework
- LVGL graphics library
- Gesture recognition
- Smooth animations
- Theme support

// Health Monitoring
- Step counter
- Sedentary alerts
- Heart rate (if sensor added)
```

## 4. COMMUNICATION PROTOCOLS

### WiFi Mode:
```json
{
  "device_id": "BTN_001",
  "type": "service_request",
  "location": "master-suite",
  "timestamp": 1674834521,
  "battery": 85,
  "rssi": -65
}
```

### LoRa Mode (Binary):
```
[Header: 2 bytes]
[Device ID: 4 bytes]  
[Message Type: 1 byte]
[Location ID: 2 bytes]
[Timestamp: 4 bytes]
[Battery: 1 byte]
[Checksum: 2 bytes]
Total: 16 bytes per message
```

## 5. DEVELOPMENT SETUP

### Required Tools:
- PlatformIO or Arduino IDE
- ESP-IDF v5.0+
- Heltec/LilyGo board packages
- USB-C cable for programming

### Libraries:
```ini
; platformio.ini
[env:heltec_wifi_lora_32_V3]
platform = espressif32
board = heltec_wifi_lora_32_V3
framework = arduino
lib_deps = 
    heltec/Heltec ESP32 Dev-Boards
    sandeepmistry/LoRa
    knolleary/PubSubClient
    bblanchon/ArduinoJson

[env:lilygo_t_watch_s3]
platform = espressif32
board = lilygo-t-watch-s3
framework = arduino
lib_deps =
    lvgl/lvgl
    bodmer/TFT_eSPI
    knolleary/PubSubClient
    bblanchon/ArduinoJson
```

## 6. POWER CONSUMPTION

### Smart Button (Heltec LoRa V3):
- Active WiFi: ~150mA
- Active LoRa: ~100mA  
- Display on: ~20mA
- Deep sleep: ~10μA
- **Battery life: 3-5 days**

### Smartwatch (T-Watch S3):
- Display on: ~180mA
- Display off: ~50mA
- Deep sleep: ~150μA
- **Battery life: 1-2 days**

## 7. MESH NETWORK TOPOLOGY

```
┌─────────────┐     ┌─────────────┐
│   Server    │     │   Server    │
│  (Primary)  │     │ (Failover)  │
└──────┬──────┘     └──────┬──────┘
       │                    │
    WiFi 2.4GHz         WiFi 2.4GHz
       │                    │
┌──────┴──────┐     ┌──────┴──────┐
│  Repeater   │═════│  Repeater   │  ESP-NOW
│   (ESP32)   │     │   (ESP32)   │  Mesh
└──────┬──────┘     └──────┬──────┘
       │                    │
   ┌───┴───┐            ┌───┴───┐
   │Button │            │Button │
   │(LoRa) │            │(LoRa) │
   └───────┘            └───────┘
       ║                    ║
   LoRa Link            LoRa Link
   (Backup)             (Backup)
       ║                    ║
   ┌───╨───┐            ┌───╨───┐
   │Watch  │            │Watch  │
   └───────┘            └───────┘
```

## 8. DEPLOYMENT PHASES

### IMMEDIATE PRIORITY (Development Order):
1. **Heltec LoRa V3 Button** - Guest device
   - Simple press = service request
   - Works like virtual button
   - WiFi-only for METSTRADE
   - OLED shows location name

2. **LilyGo T-Watch S3** - Crew device
   - Receives request notifications
   - Accept/Complete requests
   - Vibration + sound alerts
   - Touch interface

3. **Custom PCB Button** (when arrives)
   - Production version of guest button
   - Replaces Heltec for final product

### METSTRADE 2025 Demo Setup:
- **Guest Side:** Heltec button (or custom PCB)
- **Crew Side:** T-Watch for receiving requests
- **Simple Flow:** Button press → Server → Watch notification
- **No complex features:** Just basic request flow

### Phase 1: Basic Implementation (Pre-METSTRADE)
- Single button press = service request
- WiFi connection to server
- Visual feedback (screen/LED)
- Battery monitoring

### Phase 2: Heltec LoRa V3 (Post-METSTRADE)
- Additional button options
- LoRa testing
- Multiple press patterns
- OLED display integration

### Phase 3: Crestron Integration (Q1 2025)
- **Crestron RMC3 control**
- Light control via API
- Scene activation
- Climate control
- Blinds/curtains

### Phase 4: Repeaters & Mesh (Q2 2025)
- LilyGo T3S3 repeaters
- ESP-NOW local mesh
- Basic failover support
- Message queuing

### Phase 5: Full Integration (Q3-Q4 2025)
- Complete failover system
- Multi-device sync
- Advanced analytics
- Full home automation