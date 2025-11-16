# OBEDIO Smart Button - ESP-IDF Firmware

**Status**: ✅ **FULLY FUNCTIONAL** - Button detection and MQTT reporting working
**Version**: v3.0-esp-idf
**Last Updated**: November 16, 2025

ESP32-S3 firmware for custom PCB smart button with MQTT integration for yacht crew management.

## 🚀 Quick Start

**Choose your platform**:
- **Windows**: See [WINDOWS_SETUP.md](WINDOWS_SETUP.md) for complete setup guide
- **Mac/Linux**: See "Build & Flash" section below

**Current Status**: See [WORKING_STATUS.md](WORKING_STATUS.md) for detailed feature status

## Hardware

- **MCU**: ESP32-S3-WROOM-1 (8MB Flash, 2MB PSRAM)
- **Buttons**: 6x via MCP23017 I2C GPIO expander (0x20)
- **Accelerometer**: LIS3DHTR via I2C (0x19)
- **LEDs**: 16x WS2812B NeoPixel (GPIO17)
- **Touch**: Capacitive touch sensor (GPIO1)
- **Microphone**: I2S MEMS (INMP441) - *Currently disabled*
- **Speaker**: I2S amplifier (MAX98357A) - *Currently disabled*

## ✅ Working Features (November 16, 2025)

- ✅ **6 physical buttons** (T1-T6) - all working perfectly
- ✅ **Capacitive touch sensor** - single/double touch
- ✅ **MQTT integration** - all button presses sent to broker
- ✅ **White running light** - LED animation showing device status
- ✅ **WiFi connection** - connects to "Obedio" network automatically
- ✅ **mDNS discovery** (`obedio-{MAC}.local`)
- ✅ **Heartbeat** - MQTT message every 30 seconds
- ✅ **Short vs Long press detection** - different events for <0.5s vs ≥0.5s
- ✅ **NVS configuration storage**
- ✅ **Factory reset** (hold T6 on boot)

## ❌ Temporarily Disabled Features

These features have code implemented but are disabled due to technical issues:

- ❌ **Voice recording** - Causes watchdog timeout (code in `audio_recorder.c`)
- ❌ **Web interface** - Causes heap corruption (code in `web_server.c`)
- ❌ **OTA firmware updates** - Depends on web server (code in `ota_handler.c`)

**Note**: Button logic still differentiates short press (button event) vs long press (voice event), but doesn't actually record audio yet.

## Network Configuration

### Defaults
- **WiFi SSID**: "Obedio"
- **WiFi Password**: "BrankomeinBruder:)"
- **MQTT Broker**: `mqtt://10.10.0.10:1883`

### Web Interface
Access at: `http://obedio-{MAC}.local` or `http://{DEVICE_IP}`

Pages:
- `/` - Configuration (WiFi, MQTT, settings)
- `/debug` - Live sensor data and testing
- `/status` - Device info and uptime
- `/ota` - Firmware update upload

## Building

### Prerequisites
```bash
# Install ESP-IDF v5.1+
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
git checkout v5.1.2
./install.sh esp32s3
source export.sh
```

### Build Commands
```bash
cd hardware/obedio-esp-idf

# Configure (optional - defaults are set)
idf.py menuconfig

# Build
idf.py build

# Flash
idf.py -p /dev/ttyACM0 flash

# Monitor serial output
idf.py monitor

# Or all in one
idf.py -p /dev/ttyACM0 flash monitor
```

## Button Functions

| Button | Short Press | Long Press (>700ms) | Double-Click |
|--------|-------------|---------------------|--------------|
| **T1 (main)** | Service request | Voice recording | Urgent request |
| **T2 (aux1)** | Call service | - | - |
| **T3 (aux2)** | Lights control | - | - |
| **T4 (aux3)** | Prepare food | - | - |
| **T5 (aux4)** | Bring drinks | - | - |
| **T6 (aux5)** | Toggle DND | Factory reset (on boot) | - |

**Touch Sensor**: Alternative to main button (single/double touch)
**Shake**: Emergency alert (red LEDs)

## LED Indicators

| Color | Meaning |
|-------|---------|
| Rainbow | Normal operation (idle) |
| White | Single button press |
| Yellow | Double-click |
| Blue | Long press (recording) |
| Cyan | Touch sensor activated |
| Purple | Double-touch |
| Red | Shake/Emergency |
| Pulsing Blue | WiFi connecting |
| Pulsing Green | MQTT connecting |

## MQTT Messages

### Button Press
```json
{
  "deviceId": "BTN-A1B2C3D4E5F6",
  "button": "main",
  "pressType": "single",
  "battery": 100,
  "rssi": -45,
  "firmwareVersion": "v3.0-esp-idf",
  "timestamp": 1234567890,
  "sequenceNumber": 42
}
```

**Topic**: `obedio/button/{deviceId}/press`

### Voice Recording
```json
{
  "deviceId": "BTN-A1B2C3D4E5F6",
  "button": "main",
  "pressType": "voice",
  "duration": 5.2,
  "format": "adpcm",
  "sampleRate": 16000,
  "audioData": "<base64-encoded-adpcm>",
  "timestamp": 1234567890,
  "sequenceNumber": 43
}
```

**Topic**: `obedio/button/{deviceId}/voice`

## Factory Reset

1. Power off device
2. Hold T6 (DND button)
3. Power on while holding
4. Keep holding for 10 seconds
5. LEDs will flash red - release button
6. Device resets to defaults

## Configuration

### Via Web Interface
1. Connect to device WiFi or access via IP
2. Navigate to `http://obedio-{MAC}.local`
3. Update settings in web UI
4. Click "Save" - device will restart

### Via menuconfig
```bash
idf.py menuconfig
# Navigate to: OBEDIO Button Configuration
# Adjust defaults
# Save and rebuild
```

### Via NVS (Advanced)
```bash
# Read current config
idf.py nvs-read obedio wifi_ssid

# Write new value
idf.py nvs-write obedio wifi_ssid string "NewSSID"
```

## Troubleshooting

### WiFi Not Connecting
- Check SSID/password in web interface
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check serial monitor: `idf.py monitor`
- Factory reset if needed

### MQTT Not Publishing
- Verify broker IP: `mqtt://10.10.0.10:1883`
- Check broker is running: `docker ps | grep mosquitto`
- Test with: `mosquitto_sub -h 10.10.0.10 -t 'obedio/#' -v`

### Buttons Not Working
- Check I2C connections (SDA=GPIO3, SCL=GPIO2)
- Verify MCP23017 detected in serial logs
- Test in debug page (`/debug`)

### LEDs Not Working
- Check GPIO17 connection
- Verify LED power supply (5V)
- Adjust brightness in web interface

### Voice Recording Issues
- Check I2S microphone connections
- Verify PSRAM enabled (required for 20s recording)
- Monitor heap usage in debug page

## Project Structure

```
obedio-esp-idf/
├── CMakeLists.txt
├── sdkconfig.defaults
├── partitions.csv
├── main/
│   ├── main.c                  # Entry point
│   ├── config.h                # Configuration constants
│   ├── wifi_manager.c/h        # WiFi + mDNS
│   ├── mqtt_handler.c/h        # MQTT client
│   ├── button_handler.c/h      # Button detection
│   ├── touch_handler.c/h       # Touch sensor
│   ├── accel_handler.c/h       # Accelerometer
│   ├── led_controller.c/h      # NeoPixel control
│   ├── audio_recorder.c/h      # Voice recording
│   ├── web_server.c/h          # HTTP server
│   ├── ota_handler.c/h         # OTA updates
│   └── device_manager.c/h      # Device management
├── components/
│   ├── mcp23017/               # GPIO expander driver
│   ├── lis3dhtr/               # Accelerometer driver
│   ├── led_effects/            # LED animations
│   └── adpcm_codec/            # Audio compression
└── web/
    ├── index.html              # Config page
    ├── debug.html              # Debug interface
    ├── status.html             # Status page
    └── ota.html                # OTA upload page
```

## Development Status

✅ Project structure
✅ Build configuration
✅ MCP23017 driver
🚧 Remaining components (use agents to complete)

## License

Part of OBEDIO Yacht Crew Management System.
