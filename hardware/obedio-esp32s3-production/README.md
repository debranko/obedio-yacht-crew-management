# OBEDIO ESP32-S3 Smart Button - Production Firmware

Production-grade firmware for the Obedio luxury smart call button system with ESP32-S3R8 custom PCB.

## 📋 Features

✅ **WiFi Connectivity** with auto-reconnect
✅ **MQTT Communication** (subscribe/publish with QoS 1)
✅ **8 Physical Buttons** via MCP23017 I2C GPIO expander
✅ **Smart Button Detection**: Single, Double, Long press
✅ **16x WS2812B RGB LED Ring** for visual feedback
✅ **I2S MEMS Microphone** for voice recording
✅ **I2S Audio Amplifier** for sound playback
✅ **LIS3DH Accelerometer** for shake detection
✅ **MCP9808 Temperature Sensor**
✅ **Capacitive Touch Sensor**
✅ **Battery Monitoring**
✅ **Automatic Device Registration**
✅ **Heartbeat & Telemetry** (30s/60s intervals)
✅ **Remote Commands** via MQTT

---

## 🔧 Hardware Requirements

### Custom PCB Components

| Component | Model | Purpose | I2C Address |
|-----------|-------|---------|-------------|
| ESP32-S3R8 | ESP32-S3-WROOM-1-N8R8 | Main MCU | - |
| MCP23017 | MCP23017T-E/ML | GPIO Expander | 0x20 |
| LIS3DH | LIS3DHTR | Accelerometer | 0x19 |
| MCP9808 | MCP9808T-E/MC | Temperature Sensor | 0x18 |
| MSM261S4030H0R | - | I2S MEMS Microphone | - |
| MAX98357A | MAX98357AETE+T | I2S Audio Amplifier | - |
| TTP223 | TTP223-BA6-TD | Capacitive Touch | - |
| WS2812B | - | RGB LED Ring (16 LEDs) | - |
| SX1262 | SX1262IMLTRT | LoRa Module (optional) | - |

### Pin Mapping (ESP32-S3)

| Function | Pin(s) | Notes |
|----------|--------|-------|
| I2C SDA | GPIO3 | Shared bus |
| I2C SCL | GPIO2 | Shared bus |
| LED Ring | GPIO17 | WS2812B Data |
| Mic BCLK | GPIO33 | I2S Clock |
| Mic WS | GPIO38 | I2S Word Select |
| Mic SD | GPIO34 | I2S Data |
| Speaker BCLK | GPIO10 | I2S Clock |
| Speaker WS | GPIO18 | I2S Word Select |
| Speaker SD | GPIO11 | I2S Data |
| Speaker SD_MODE | GPIO14 | Shutdown Control |

### Button Mapping (MCP23017 Port A)

| Button | Pin | Name | Function |
|--------|-----|------|----------|
| T1 | GPA7 | Main | Primary service call |
| T2 | GPA4 | Aux1 | Call service |
| T3 | GPA3 | Aux2 | Lights control |
| T4 | GPA2 | Aux3 | Prepare food |
| T5 | GPA1 | Aux4 | Bring drinks |
| T6 | GPA0 | Aux5 | DND toggle |

---

## 🚀 Quick Start

### Option 1: Arduino IDE

#### 1. Install Arduino IDE
Download from: https://www.arduino.cc/en/software

#### 2. Install ESP32 Board Support
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "ESP32" by Espressif Systems
6. Install version **2.0.14** or later

#### 3. Install Required Libraries
Go to **Sketch → Include Library → Manage Libraries** and install:

| Library | Version | Author |
|---------|---------|--------|
| PubSubClient | 2.8.0+ | Nick O'Leary |
| Adafruit MCP23017 | 2.3.0+ | Adafruit |
| Adafruit NeoPixel | 1.12.0+ | Adafruit |
| ArduinoJson | 6.21.0+ | Benoit Blanchon |

Or install via command line:
```bash
arduino-cli lib install "PubSubClient" "Adafruit MCP23017" "Adafruit NeoPixel" "ArduinoJson"
```

#### 4. Configure Board Settings
1. **Tools → Board**: "ESP32S3 Dev Module"
2. **Tools → USB CDC On Boot**: "Enabled"
3. **Tools → PSRAM**: "OPI PSRAM"
4. **Tools → Flash Size**: "8MB (64Mb)"
5. **Tools → Partition Scheme**: "8M with spiffs (3MB APP/1.5MB SPIFFS)"
6. **Tools → Upload Speed**: "921600"
7. **Tools → Port**: Select your COM port

#### 5. Upload Firmware
1. Open `obedio-esp32s3-production.ino`
2. Verify WiFi/MQTT credentials in `config.h`
3. Click **Upload** (→)
4. Monitor with **Tools → Serial Monitor** (115200 baud)

---

### Option 2: PlatformIO (Recommended for Advanced Users)

#### 1. Install PlatformIO
- **VS Code**: Install PlatformIO IDE extension
- **CLI**: `pip install platformio`

#### 2. Initialize Project
```bash
cd hardware/obedio-esp32s3-production
pio init --board esp32-s3-devkitc-1
```

#### 3. Configure platformio.ini
Already included in the project. Check settings:
```ini
[env:esp32-s3-devkitc-1]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
monitor_speed = 115200
lib_deps =
    knolleary/PubSubClient@^2.8
    adafruit/Adafruit MCP23017 Arduino Library@^2.3.0
    adafruit/Adafruit NeoPixel@^1.12.0
    bblanchon/ArduinoJson@^6.21.0
```

#### 4. Build & Upload
```bash
pio run --target upload
pio device monitor
```

---

## ⚙️ Configuration

### WiFi & MQTT Settings

Edit `config.h`:

```cpp
// WiFi
#define WIFI_SSID           "Obedio"
#define WIFI_PASSWORD       "BrankomeinBruder:)"

// MQTT Broker
#define MQTT_BROKER         "10.10.0.207"
#define MQTT_PORT           1883
```

### Backend Server

```cpp
#define BACKEND_HOST        "10.10.0.207"
#define BACKEND_PORT        8080
#define UPLOAD_ENDPOINT     "/api/upload/upload-audio"
```

### Button Timing

```cpp
#define DEBOUNCE_DELAY_MS       50    // Button debounce time
#define LONG_PRESS_TIME_MS      700   // Long press threshold
#define DOUBLE_CLICK_WINDOW_MS  500   // Double-click detection window
```

---

## 📡 MQTT Topics & Messages

### Topics Published by Device

#### Button Press Event
**Topic**: `obedio/button/{deviceId}/press`

```json
{
  "deviceId": "BTN-D4CA6E112233",
  "button": "main|aux1|aux2|aux3|aux4|aux5",
  "pressType": "single|double|long|press",
  "timestamp": 1234567890,
  "battery": 85,
  "rssi": -45,
  "firmwareVersion": "v1.0-custom-pcb",
  "sequenceNumber": 1234
}
```

#### Device Registration
**Topic**: `obedio/device/register`

```json
{
  "deviceId": "BTN-D4CA6E112233",
  "type": "smart_button",
  "name": "ESP32-S3 Smart Button",
  "firmwareVersion": "v1.0-custom-pcb",
  "hardwareVersion": "ESP32-S3 Custom PCB v3.0",
  "macAddress": "D4:CA:6E:11:22:33",
  "ipAddress": "10.10.0.123",
  "rssi": -45,
  "capabilities": {
    "button": true,
    "audio": true,
    "led": true,
    "voice_recording": true,
    "accelerometer": true,
    "temperature": true
  }
}
```

#### Heartbeat
**Topic**: `obedio/device/heartbeat`

```json
{
  "deviceId": "BTN-D4CA6E112233",
  "timestamp": 1234567890,
  "rssi": -45,
  "battery": 100,
  "uptime": 3600,
  "freeHeap": 145632
}
```

#### Telemetry
**Topic**: `obedio/device/{deviceId}/telemetry`

```json
{
  "deviceId": "BTN-D4CA6E112233",
  "timestamp": 1234567890,
  "uptime": 3600,
  "rssi": -45,
  "battery": 100,
  "freeHeap": 145632,
  "firmwareVersion": "v1.0-custom-pcb",
  "hardwareVersion": "ESP32-S3 Custom PCB v3.0",
  "ipAddress": "10.10.0.123",
  "macAddress": "D4:CA:6E:11:22:33"
}
```

### Topics Subscribed by Device

#### Command Topic
**Topic**: `obedio/device/{deviceId}/command`

**LED Control Command**:
```json
{
  "command": "led",
  "color": "red|green|blue|off"
}
```

**Reboot Command**:
```json
{
  "command": "reboot"
}
```

**Status Request**:
```json
{
  "command": "status"
}
```

#### Registration Confirmation
**Topic**: `obedio/device/{deviceId}/registered`

```json
{
  "status": "registered",
  "deviceId": "BTN-D4CA6E112233"
}
```

---

## 🔍 Debugging

### Serial Monitor Output

Expected startup sequence:
```
═══════════════════════════════════════════════════════
  OBEDIO ESP32-S3 Smart Button
  Firmware: v1.0-custom-pcb
  Hardware: ESP32-S3 Custom PCB v3.0
═══════════════════════════════════════════════════════

Device ID: BTN-D4CA6E112233
MQTT Client ID: obedio-button-1234567

Initializing I2C bus...
Scanning I2C devices...
  Found device at 0x18
  Found device at 0x19
  Found device at 0x20
Found 3 I2C device(s)

Initializing MCP23017 GPIO expander... ✓
Initializing LED ring (16x WS2812B)... ✓
Initializing button states...
✓ Button handling ready

Connecting to WiFi...
SSID: Obedio
..........
✓ WiFi connected!
IP Address: 10.10.0.123
Signal Strength (RSSI): -45 dBm
MAC Address: D4:CA:6E:11:22:33

Configuring MQTT...
Broker: 10.10.0.207:1883
Connecting to MQTT broker... ✓ Connected!
✓ Subscribed to: obedio/device/BTN-D4CA6E112233/command
✓ Subscribed to: obedio/device/BTN-D4CA6E112233/registered

Registering device with backend...
✓ Device registration sent

✓ Setup complete - Ready!
```

### LED Status Indicators

| Color | Meaning |
|-------|---------|
| 🔵 Blue | Connecting to WiFi |
| 🟢 Green | Connected successfully |
| 🔴 Red | Error / Connection failed |
| 🟠 Orange | Reconnecting / Long press |
| 🟣 Purple | MQTT connecting |
| ⚪ White | Button pressed |
| 🔷 Cyan | Double-click detected |
| ⚫ Off | Idle / Normal operation |

### Common Issues

#### "Failed to connect to MQTT broker"
- Check MQTT broker is running: `nc -zv 10.10.0.207 1883`
- Verify network connectivity
- Check broker logs for connection attempts

#### "MCP23017 initialization failed"
- Verify I2C connections (SDA=GPIO3, SCL=GPIO2)
- Check I2C device address (0x20)
- Run I2C scanner to detect devices

#### "No button response"
- Check MCP23017 is detected in I2C scan
- Verify pull-up resistors on button lines
- Check button wiring to MCP23017 Port A

#### "WiFi won't connect"
- Verify SSID and password in `config.h`
- Check WiFi signal strength
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)

---

## 📊 Performance & Specifications

| Metric | Value |
|--------|-------|
| Boot Time | ~3-5 seconds |
| WiFi Connect Time | ~2-5 seconds |
| MQTT Connect Time | ~500ms |
| Button Response Time | <50ms |
| Heartbeat Interval | 30 seconds |
| Telemetry Interval | 60 seconds |
| Memory Usage | ~150KB (of 512KB) |
| Flash Usage | ~1.2MB (of 8MB) |

---

## 🔐 Security Considerations

⚠️ **Current Implementation** (Development):
- No MQTT authentication
- Unencrypted MQTT communication
- No TLS/SSL

✅ **Production Recommendations**:
1. Enable MQTT authentication with username/password
2. Use MQTTS (MQTT over TLS) on port 8883
3. Implement certificate-based authentication
4. Enable OTA firmware updates with signature verification
5. Use WPA3 WiFi security if available

---

## 🛠️ Advanced Features (Coming Soon)

- [ ] Voice recording and upload to backend
- [ ] Accelerometer-based shake detection
- [ ] Temperature monitoring and alerts
- [ ] LoRa long-range communication
- [ ] Over-the-air (OTA) firmware updates
- [ ] Low-power sleep modes
- [ ] Wireless charging detection
- [ ] Battery level monitoring via ADC

---

## 📚 Resources

### Documentation
- [ESP32-S3 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf)
- [MCP23017 Datasheet](https://ww1.microchip.com/downloads/en/devicedoc/20001952c.pdf)
- [PubSubClient Library](https://github.com/knolleary/pubsubclient)
- [Arduino ESP32 Core](https://github.com/espressif/arduino-esp32)

### Tools
- [MQTT Explorer](http://mqtt-explorer.com/) - GUI MQTT client
- [Mosquitto](https://mosquitto.org/) - MQTT broker
- [PlatformIO](https://platformio.org/) - IDE for embedded development

---

## 📝 License

Copyright © 2025 Obedio Team. All rights reserved.

---

## 🆘 Support

For issues or questions:
1. Check the debugging section above
2. Review serial monitor output
3. Verify hardware connections
4. Check MQTT broker logs
5. Contact: support@obedio.com

---

**Version**: 1.0
**Last Updated**: 2025-01-17
**Tested With**: Arduino ESP32 Core 2.0.14, PlatformIO 6.1
