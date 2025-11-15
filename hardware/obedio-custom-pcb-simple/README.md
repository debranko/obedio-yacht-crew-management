# Obedio Custom PCB - Simplified Firmware

Clean, simple firmware for ESP32-S3 custom button PCB with accelerometer support.

## Hardware

- **ESP32-S3** microcontroller
- **MCP23017** I2C IO expander (6 buttons) - Address: 0x20
- **LIS3DHTR** I2C accelerometer (shake detection) - Address: 0x19
- **WS2812B** NeoPixel ring (16 LEDs)

## Pin Configuration

### I2C Bus (Shared)
- **SDA:** GPIO 3
- **SCL:** GPIO 2

### Devices on I2C
- **MCP23017:** 0x20 (buttons)
- **LIS3DHTR:** 0x19 (accelerometer)

### Buttons (MCP23017 GPA Bank)
- **T1:** GPA7 (main button)
- **T2:** GPA6
- **T3:** GPA5
- **T4:** GPA4
- **T5:** GPA3
- **T6:** GPA0

### NeoPixel
- **Data:** GPIO 17
- **Count:** 16 LEDs

## Network Configuration

```cpp
WiFi SSID: "Obedio"
WiFi Password: "BrankomeinBruder:)"
MQTT Broker: 10.10.0.207:1883
```

## Required Arduino Libraries

1. **Adafruit MCP23017** - Button IO expander
2. **ArduinoJson** - JSON serialization
3. **Adafruit NeoPixel** - LED control
4. **Seeed LIS3DHTR** - Accelerometer (install from Library Manager: "Grove - 3-Axis Digital Accelerometer")
5. **PubSubClient** - MQTT client
6. **WiFi** - Built-in ESP32

### Installing LIS3DHTR Library

Arduino IDE → Tools → Manage Libraries → Search: **"Grove - 3-Axis Digital Accelerometer"** → Install

Or install via GitHub: https://github.com/Seeed-Studio/Seeed_Arduino_LIS3DHTR

## Features

### Button Press
- All 6 buttons send MQTT events
- Visual feedback: White LED flash
- Sends JSON payload to backend
- Auto device registration

### Shake Detection (Emergency)
- Uses LIS3DHTR accelerometer
- Threshold: 2.5 G-force
- Cooldown: 2 seconds between detections
- Visual feedback: Red LED flash
- Sends "shake" event (emergency priority)

### LED Animation
- Continuous rainbow effect
- Brightness: 200/255
- Update interval: 150ms

### MQTT Integration
- **Topic:** `obedio/button/{deviceId}/press`
- **Registration:** `obedio/device/register`
- **Payload format:**
```json
{
  "deviceId": "BTN-A1B2C3D4E5F6",
  "button": "main",
  "pressType": "single",
  "battery": 100,
  "rssi": -45,
  "firmwareVersion": "v1.0-simple",
  "timestamp": 1234567,
  "sequenceNumber": 42
}
```

## Backend Integration

### Button Events
- **T1-T6 single press** → Creates service request with `requestType: "call"`
- **Shake** → Creates service request with `requestType: "emergency"`, `priority: "emergency"`

### Device Registration
Automatically registers on MQTT connect with:
- Device ID (MAC-based)
- Hardware info
- Capabilities (button, LED, accelerometer)
- Network info (IP, RSSI)

## LED Feedback

| Event | LED Color | Duration |
|-------|-----------|----------|
| Button press | White flash | 100ms |
| Shake detected | Red flash | 200ms |
| Idle | Rainbow animation | Continuous |
| Startup | Green wipe | Once |
| Error (no MCP) | Red blink | Continuous |

## Accelerometer Settings

```cpp
Data rate: 50 Hz
Full scale range: ±2G
Shake threshold: 2.5 G
Debounce: 2000ms (2 seconds)
```

## Upload Instructions

1. Open `obedio-custom-pcb-simple.ino` in Arduino IDE
2. Select board: **ESP32S3 Dev Module**
3. Select port
4. Upload
5. Open Serial Monitor (115200 baud)

## Serial Monitor Output

```
NeoPixel initialized
I2C initialized
MCP23017 initialized
Buttons initialized
LIS3DHTR accelerometer initialized
Connecting to WiFi...
WiFi connected
IP: 10.10.0.123
Device ID: BTN-A1B2C3D4E5F6
Setup complete!
Connecting to MQTT... connected
Device registered
Button T1 pressed
Published: main (single)
SHAKE DETECTED - Emergency!
Published: main (shake)
```

## Troubleshooting

### MCP23017 Not Found
- Check I2C wiring (SDA=3, SCL=2)
- Verify address 0x20
- LEDs will blink red continuously

### LIS3DHTR Not Found
- Device continues without accelerometer
- Shake detection disabled
- Check I2C address 0x19

### WiFi Won't Connect
- Check SSID: "Obedio"
- Check password: "BrankomeinBruder:)"
- Verify 2.4GHz network

### MQTT Won't Connect
- Check broker: 10.10.0.207:1883
- Verify broker is running
- Check firewall

## Testing Shake Detection

1. Upload firmware
2. Wait for "Setup complete!"
3. Shake the device firmly
4. Watch Serial Monitor for "SHAKE DETECTED"
5. LEDs should flash red
6. Backend should receive emergency request

## Differences from Full Version

This simplified version:
- ✅ Simpler code structure
- ✅ Adds LIS3DHTR accelerometer
- ✅ Shake detection for emergencies
- ✅ Backend-compatible JSON payloads
- ❌ No I2S audio recording
- ❌ No speaker playback
- ✅ All 6 buttons functional
- ✅ Auto device registration
- ✅ Rainbow LED animation
