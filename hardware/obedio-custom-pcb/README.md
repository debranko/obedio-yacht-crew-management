# Obedio Custom PCB - ESP32-S3 Smart Button Firmware

Complete firmware for the custom Obedio Smart Button PCB with ESP32-S3.

## Hardware Specifications

### MCU
- **ESP32-S3** dual-core processor
- WiFi connectivity
- Dual I2S interfaces (microphone + speaker)

### Components
- **MCP23017 I2C IO Expander** - 5 buttons (T1-T5)
- **WS2812B NeoPixel Ring** - 16 RGB LEDs
- **I2S MEMS Microphone** - 24-bit audio input
- **MAX98357A Speaker Amplifier** - I2S audio output

## Pin Connections

### I2C (MCP23017)
- **SDA:** GPIO 3
- **SCL:** GPIO 2
- **Address:** 0x20

### Buttons (MCP23017 GPA Bank)
- **T1 (Main):** GPA7
- **T2:** GPA6
- **T3:** GPA5
- **T4:** GPA4
- **T5:** GPA3

### NeoPixel LED Ring
- **Data:** GPIO 17
- **LEDs:** 16 pixels

### I2S Microphone
- **BCLK:** GPIO 33
- **WS (LRCLK):** GPIO 38
- **SD (Data):** GPIO 34

### I2S Speaker (MAX98357A)
- **BCLK:** GPIO 10
- **WS (LRCLK):** GPIO 18
- **DIN (Data):** GPIO 11
- **SD_MODE (Enable):** GPIO 14

## Required Arduino Libraries

Install these libraries via Arduino Library Manager:

1. **WiFi** (built-in with ESP32 core)
2. **PubSubClient** - MQTT client
   - By Nick O'Leary
   - Version 2.8+

3. **ArduinoJson** - JSON serialization
   - By Benoit Blanchon
   - Version 6.x

4. **Adafruit MCP23017** - IO expander
   - By Adafruit
   - Requires: Adafruit BusIO

5. **Adafruit NeoPixel** - LED control
   - By Adafruit
   - Version 1.10+

6. **ESP32 I2S** (built-in with ESP32 core)

## ESP32 Board Setup

### Arduino IDE Configuration
1. Install ESP32 board support:
   - File → Preferences
   - Additional Board Manager URLs: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

2. Select board:
   - Tools → Board → ESP32 Arduino → **ESP32S3 Dev Module**

3. Board settings:
   - **USB CDC On Boot:** Enabled
   - **Flash Mode:** QIO
   - **Flash Size:** 4MB (or your board's size)
   - **Partition Scheme:** Default 4MB with spiffs
   - **PSRAM:** Enabled (if available)

## Network Configuration

### WiFi Settings (in code)
```cpp
const char* WIFI_SSID = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";
```

### MQTT Broker
```cpp
const char* MQTT_BROKER = "10.10.0.207";
const int MQTT_PORT = 1883;
```

## Device Configuration

### Location Assignment (Optional)
To assign the button to a specific cabin/location, set these values:

```cpp
const char* LOCATION_ID = "your-location-uuid-here";
const char* GUEST_ID = "";  // Optional guest assignment
```

Leave empty for auto-assignment via backend.

## Features

### Button Functions

#### T1 (Main Button - GPA7)
- **Press & Hold:** Records audio while held
- **Release:** Plays back recorded audio
- **MQTT Event:** Sends "voice" press type
- **Max Recording:** 3 seconds at 16kHz
- **LED Feedback:** Blue while recording, green during playback

#### T2-T5 (Auxiliary Buttons)
- **Press:** Sends service request
- **MQTT Event:** Sends "single" press type
- **LED Feedback:** White flash

### LED Ring
- **Continuous rainbow animation** (rotates every 150ms)
- **Brightness:** 200/255
- **Press feedback:** White flash (100ms)
- **Recording:** All blue
- **Playback:** All green
- **Startup:** Green wipe animation

### Audio System
- **Sample Rate:** 16 kHz
- **Bit Depth:** 16-bit (converted from 24-bit mic)
- **Max Recording Time:** 3 seconds
- **Buffer Size:** 48,000 samples (96KB)

### Network Features
- **Auto WiFi reconnect** (20 second timeout)
- **Auto MQTT reconnect** (10 second timeout)
- **Device registration** on startup
- **Heartbeat** every 30 seconds
- **RSSI monitoring**
- **Sequence numbering** for all messages

## MQTT Topics

### Published by Device

#### Device Registration
- **Topic:** `obedio/device/register`
- **Payload:**
```json
{
  "deviceId": "BTN-A1B2C3D4E5F6",
  "type": "smart_button",
  "name": "Custom PCB Button",
  "firmwareVersion": "v1.0-custom-pcb",
  "hardwareVersion": "ESP32-S3 Custom PCB",
  "capabilities": {
    "button": true,
    "audio": true,
    "led": true,
    "voice_recording": true
  }
}
```

#### Button Press
- **Topic:** `obedio/button/{deviceId}/press`
- **Payload:**
```json
{
  "deviceId": "BTN-A1B2C3D4E5F6",
  "button": "main",
  "pressType": "voice",
  "battery": 100,
  "rssi": -45,
  "firmwareVersion": "v1.0-custom-pcb",
  "timestamp": 1234567,
  "sequenceNumber": 42
}
```

#### Heartbeat
- **Topic:** `obedio/device/heartbeat`
- **Payload:**
```json
{
  "deviceId": "BTN-A1B2C3D4E5F6",
  "timestamp": 1234567,
  "rssi": -45,
  "battery": 100,
  "uptime": 3600,
  "freeHeap": 245000
}
```

## Backend Integration

This firmware is fully compatible with the Obedio backend MQTT service:

- **Auto device registration** on first connection
- **Service request creation** for all button presses
- **WebSocket notifications** to all connected clients
- **Crew watch notifications** for assigned crew members
- **Activity logging** for all events

### Backend Behavior

**T1 Button (Voice):**
- Creates service request with `requestType: "voice"`
- Priority: `normal`

**T2-T5 Buttons:**
- Creates service request with `requestType: "call"`
- Priority: `normal` (single press) or `urgent` (double press if implemented)

## Serial Monitor Output

Expected output on startup:

```
========================================
OBEDIO - Custom PCB ESP32-S3 Button
========================================

✅ MCP23017 initialized
✅ Buttons initialized
✅ NeoPixel initialized
✅ Microphone initialized
✅ Speaker initialized
Device ID: BTN-A1B2C3D4E5F6
Connecting to WiFi: Obedio
✅ WiFi connected!
IP address: 10.10.0.123
Signal strength (RSSI): -45 dBm
Connecting to MQTT broker: 10.10.0.207:1883
✅ MQTT connected!
✅ Device registered!

✅ Device ready! Press buttons to test.
```

## Troubleshooting

### WiFi Won't Connect
- Check SSID and password in code
- Verify 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check signal strength

### MQTT Won't Connect
- Verify MQTT broker IP: `10.10.0.207`
- Check broker is running: `netstat -an | findstr 1883`
- Verify firewall allows port 1883

### Buttons Not Working
- Check I2C wiring (SDA=GPIO3, SCL=GPIO2)
- Verify MCP23017 address: 0x20
- Check pull-up resistors on buttons

### Audio Not Working
- **Microphone:** Check I2S pins (BCLK=33, WS=38, SD=34)
- **Speaker:** Check SD_MODE pin is HIGH (GPIO 14)
- Verify I2S pin connections to MAX98357A

### LEDs Not Responding
- Check NeoPixel data pin: GPIO 17
- Verify power to LED ring (5V, GND)
- Check brightness setting (default: 200)

## Flashing Instructions

1. **Connect ESP32-S3** via USB
2. **Select Port:** Tools → Port → (your COM port)
3. **Upload:** Sketch → Upload (Ctrl+U)
4. **Open Serial Monitor:** Tools → Serial Monitor (115200 baud)
5. **Monitor output** for connection status

## Testing

### Quick Test
```bash
# From backend directory
node test-button-press.js
```

### Manual Test
1. Press any button (T1-T5)
2. Check Serial Monitor for MQTT publish
3. Check backend logs for service request creation
4. Check frontend for new service request

### Audio Test (T1)
1. Press and hold T1 button
2. Speak while holding (max 3 seconds)
3. Release button
4. Listen to playback
5. Check MQTT for "voice" event

## Maintenance

### Update Firmware
1. Modify code as needed
2. Upload new firmware via Arduino IDE
3. Device will auto-reconnect and register

### Change Network
1. Update `WIFI_SSID`, `WIFI_PASSWORD`, `MQTT_BROKER`
2. Re-upload firmware
3. Device will connect to new network

### Assign to Location
1. Get location UUID from backend
2. Set `LOCATION_ID` in code
3. Re-upload firmware

## Version History

- **v1.0-custom-pcb** - Initial release
  - 5 button support via MCP23017
  - NeoPixel rainbow animation
  - T1 voice recording/playback
  - Full MQTT integration
  - Backend auto-registration
