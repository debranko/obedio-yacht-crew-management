# Obedio Custom PCB - PlatformIO Firmware

Professional production-ready firmware for the Obedio ESP32-S3 Smart Button PCB using PlatformIO.

## Features

- ✅ **Modular Code Structure** - Separated into logical modules (hardware, network, MQTT)
- ✅ **Multiple Build Environments** - Debug, Release, OTA-enabled builds
- ✅ **Automated Dependency Management** - Libraries auto-download on first build
- ✅ **Advanced Build Optimization** - Compiler optimizations for production
- ✅ **Professional Debugging** - Built-in exception decoder and logging levels
- ✅ **OTA Updates Support** - Over-the-air firmware updates capability
- ✅ **Centralized Configuration** - All settings in `include/config.h`

## Hardware

- **MCU:** ESP32-S3 (240MHz dual-core, WiFi)
- **IO Expander:** MCP23017 (I2C) - 6 buttons
- **Accelerometer:** LIS3DHTR (I2C) - Shake detection
- **LEDs:** WS2812B NeoPixel Ring - 16 RGB LEDs
- **Communication:** WiFi + MQTT

## Project Structure

```
obedio-custom-pcb-platformio/
├── platformio.ini          # PlatformIO configuration
├── include/
│   ├── config.h           # Centralized configuration
│   ├── hardware.h         # Hardware interface
│   ├── network.h          # Network interface
│   └── mqtt_handler.h     # MQTT utilities
├── src/
│   ├── main.cpp           # Main entry point
│   ├── hardware.cpp       # Hardware implementation
│   ├── network.cpp        # Network implementation
│   └── mqtt_handler.cpp   # MQTT utilities
└── README.md             # This file
```

## Prerequisites

### Install PlatformIO

**Option 1: VS Code Extension (Recommended)**
1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Open VS Code
3. Go to Extensions (Ctrl+Shift+X)
4. Search for "PlatformIO IDE"
5. Click Install

**Option 2: Command Line**
```bash
pip install platformio
```

## Quick Start

### 1. Open Project in VS Code

```bash
code obedio-custom-pcb-platformio
```

### 2. Configure Your Hardware

Edit `include/config.h` to match your setup:

```cpp
#define WIFI_SSID "Obedio"
#define WIFI_PASSWORD "BrankomeinBruder:)"
#define MQTT_BROKER "10.10.0.207"
#define MQTT_PORT 1883
```

### 3. Select Your COM Port

Edit `platformio.ini`:

```ini
upload_port = COM3      ; Change to your COM port
monitor_port = COM3     ; Change to your COM port
```

### 4. Build and Upload

**Using VS Code:**
- Click "PlatformIO" icon in sidebar
- Project Tasks → esp32s3 → Upload
- Project Tasks → esp32s3 → Monitor

**Using Command Line:**
```bash
# Build
pio run -e esp32s3

# Upload
pio run -e esp32s3 -t upload

# Monitor serial
pio device monitor

# Build + Upload + Monitor (all in one)
pio run -e esp32s3 -t upload && pio device monitor
```

## Build Environments

The project includes 4 pre-configured build environments:

### 1. `esp32s3` (Default - Development)
Standard development build with debugging enabled.

```bash
pio run -e esp32s3 -t upload
```

### 2. `esp32s3-debug` (Deep Debugging)
Full debug symbols, no optimization, verbose logging.

```bash
pio run -e esp32s3-debug -t upload
```

### 3. `esp32s3-release` (Production)
Optimized for size and speed, debug symbols stripped.

```bash
pio run -e esp32s3-release -t upload
```

### 4. `esp32s3-ota` (OTA Updates)
Enables over-the-air firmware updates via WiFi.

```bash
pio run -e esp32s3-ota -t upload --upload-port 10.10.0.xxx
```

## Configuration

All configuration is centralized in `include/config.h`:

### Network Settings
```cpp
#define WIFI_SSID "Obedio"
#define WIFI_PASSWORD "BrankomeinBruder:)"
#define MQTT_BROKER "10.10.0.207"
#define MQTT_PORT 1883
```

### Hardware Pins
```cpp
#define I2C_SDA_PIN 3
#define I2C_SCL_PIN 2
#define LED_PIN 17
#define LED_COUNT 16
```

### Feature Flags
```cpp
#define ENABLE_ACCELEROMETER 1    // Enable shake detection
#define ENABLE_LED_ANIMATION 1    // Enable rainbow animation
#define ENABLE_SERIAL_DEBUG 1     // Enable serial logging
#define ENABLE_HEARTBEAT 1        // Enable periodic heartbeat
```

### Debug Levels
```cpp
#define DEBUG_LEVEL 3  // 0=None, 1=Error, 2=Warning, 3=Info, 4=Debug
```

## Libraries

Libraries are automatically managed by PlatformIO. Defined in `platformio.ini`:

- **Adafruit MCP23017** - IO expander driver
- **Adafruit NeoPixel** - LED control
- **PubSubClient** - MQTT client
- **ArduinoJson** - JSON serialization
- **Seeed Arduino LIS3DHTR** - Accelerometer driver

## Serial Monitor Output

Expected output on successful startup:

```
========================================
OBEDIO - Custom PCB ESP32-S3 Button
========================================
Firmware: Obedio Custom PCB v1.0.0
Hardware: ESP32-S3 v1.0

✅ I2C bus initialized
✅ NeoPixel initialized
✅ MCP23017 initialized
✅ 6 buttons initialized
✅ LIS3DHTR accelerometer initialized
Device ID: BTN-A1B2C3D4E5F6
Connecting to WiFi: Obedio
✅ WiFi connected!
IP address: 10.10.0.123
Signal strength: -45 dBm
Connecting to MQTT broker: 10.10.0.207:1883
Attempt 1: ✅ MQTT connected!
📝 Registering device...
✅ Device registered

✅ Setup complete! Device ready.

🔘 Button T1 pressed
📤 Published: main (single)
💓 Heartbeat sent
```

## Testing

### Test Button Press
1. Press any button (T1-T6)
2. Serial monitor shows: `🔘 Button TX pressed`
3. LEDs flash white
4. MQTT message published
5. Backend creates service request

### Test Shake Detection
1. Shake the device firmly
2. Serial monitor shows: `⚠️ SHAKE DETECTED - Emergency!`
3. LEDs flash red
4. MQTT emergency event published

### Test MQTT Connection
```bash
# Monitor MQTT traffic
mosquitto_sub -h 10.10.0.207 -t "obedio/#" -v
```

## Troubleshooting

### Build Errors

**"Library not found"**
```bash
# Clean and rebuild
pio run -t clean
pio run
```

**"Upload failed"**
- Check COM port in `platformio.ini`
- Press and hold BOOT button during upload
- Check USB cable

### Runtime Errors

**WiFi won't connect**
- Check SSID and password in `config.h`
- Verify 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check signal strength

**MQTT won't connect**
- Verify MQTT broker IP: `10.10.0.207`
- Check broker is running: `netstat -an | findstr 1883`
- Check firewall allows port 1883

**MCP23017 not found**
- Check I2C wiring (SDA=GPIO3, SCL=GPIO2)
- Verify I2C address: 0x20
- Check pull-up resistors

**Accelerometer not responding**
- Check I2C address: 0x19
- Disable in `config.h`: `#define ENABLE_ACCELEROMETER 0`

## OTA Updates

Enable OTA in your code, then upload via WiFi:

1. **Initial USB upload** (with OTA code)
```bash
pio run -e esp32s3-ota -t upload
```

2. **Note the device IP** from serial monitor

3. **Update `platformio.ini`** with device IP
```ini
upload_port = 10.10.0.123  ; Your ESP32 IP
```

4. **Upload via OTA**
```bash
pio run -e esp32s3-ota -t upload
```

## Advanced Features

### Custom Build Flags

Add in `platformio.ini`:

```ini
build_flags =
    -D MY_CUSTOM_DEFINE=1
    -D CUSTOM_TIMEOUT=5000
```

### Monitor Filters

```ini
monitor_filters =
    esp32_exception_decoder  ; Decode stack traces
    colorize                ; Color output
    time                    ; Add timestamps
```

### Board Partitions

Use custom partition table:

```ini
board_build.partitions = custom_partitions.csv
```

## Performance

### Memory Usage
- **Flash:** ~300KB (out of 4MB)
- **RAM:** ~80KB (out of 512KB)
- **PSRAM:** Available for future expansion

### Power Consumption
- **Active:** ~80mA @ 3.3V
- **WiFi transmit:** ~200mA peak
- **LED animation:** +500mA (16 LEDs at full brightness)

## Production Deployment

For production, use the **release** environment:

```bash
pio run -e esp32s3-release -t upload
```

Benefits:
- ✅ Optimized code size (-O3)
- ✅ Faster execution (LTO enabled)
- ✅ Debug symbols stripped
- ✅ Smaller binary size

## Version History

- **v1.0.0** - Initial PlatformIO migration
  - Modular code structure
  - Multiple build environments
  - Full feature parity with Arduino version
  - Production-ready optimizations

## License

Proprietary - Obedio Yacht Crew Management System

## Support

For issues or questions, contact the development team.
