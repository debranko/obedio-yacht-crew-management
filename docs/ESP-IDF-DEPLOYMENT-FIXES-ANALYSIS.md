# ESP-IDF Project Analysis: deployment-fixes Branch

**Analysis Date**: November 17, 2025
**Branch**: deployment-fixes
**Project**: OBEDIO Yacht Crew Management - ESP32-S3 Smart Button
**Firmware Version**: v3.0-esp-idf

---

## 1. Project Structure

```
hardware/
└── obedio-esp-idf/                      # ESP-IDF Project Root
    ├── CMakeLists.txt                   # Main project configuration
    ├── sdkconfig                        # Full SDK configuration (generated)
    ├── sdkconfig.defaults               # Default configuration values
    ├── partitions.csv                   # Flash partition table
    ├── README.md                        # Main documentation
    ├── OTA_UPDATE_GUIDE.md              # OTA deployment guide
    ├── WINDOWS_SETUP.md                 # Windows build setup
    ├── CONFIGURATION_GUIDE.md           # Runtime configuration
    ├── WORKING_STATUS.md                # Feature status
    ├── setup_and_flash.sh               # Linux/Mac flash script
    │
    ├── main/                            # Main application code
    │   ├── CMakeLists.txt               # Main component build config
    │   ├── idf_component.yml            # Component dependencies
    │   ├── Kconfig.projbuild            # menuconfig settings
    │   │
    │   ├── main.c                       # Application entry point
    │   ├── config.h                     # Central configuration header
    │   │
    │   ├── wifi_manager.c/h             # WiFi + mDNS management
    │   ├── mqtt_handler.c/h             # MQTT client & messaging
    │   ├── ota_handler.c/h              # OTA firmware updates
    │   ├── web_server.c/h               # HTTP server (disabled)
    │   │
    │   ├── button_handler.c/h           # 6-button detection (MCP23017)
    │   ├── touch_handler.c/h            # Capacitive touch sensor
    │   ├── accel_handler.c/h            # Accelerometer (LIS3DHTR)
    │   ├── led_controller.c/h           # WS2812B LED control
    │   ├── audio_recorder.c/h           # Voice recording (disabled)
    │   │
    │   ├── device_manager.c/h           # Device lifecycle management
    │   └── power_manager.c/h            # Sleep/wake management
    │
    ├── components/                      # Custom hardware drivers
    │   ├── mcp23017/                    # I2C GPIO expander driver
    │   │   ├── CMakeLists.txt
    │   │   ├── mcp23017.c
    │   │   └── include/mcp23017.h
    │   │
    │   ├── lis3dhtr/                    # I2C accelerometer driver
    │   │   ├── CMakeLists.txt
    │   │   ├── lis3dhtr.c
    │   │   └── include/lis3dhtr.h
    │   │
    │   ├── led_effects/                 # LED animation library
    │   │   ├── CMakeLists.txt
    │   │   ├── led_effects.c
    │   │   └── include/led_effects.h
    │   │
    │   └── adpcm_codec/                 # Audio compression codec
    │       ├── CMakeLists.txt
    │       ├── adpcm_codec.c
    │       └── include/adpcm_codec.h
    │
    └── web/                             # Web interface HTML (for web_server)
        ├── index.html                   # Configuration page
        ├── debug.html                   # Debug interface
        ├── status.html                  # Status page
        └── ota.html                     # OTA upload page
```

---

## 2. OTA Update Implementation

### Overview
OTA updates are triggered via MQTT and downloaded over HTTP. The implementation includes automatic rollback protection.

### Key Files
- **[ota_handler.c](../hardware/obedio-esp-idf/main/ota_handler.c)**: Core OTA logic
- **[ota_handler.h](../hardware/obedio-esp-idf/main/ota_handler.h)**: Public API
- **[mqtt_handler.c:56-88](../hardware/obedio-esp-idf/main/mqtt_handler.c#L56-L88)**: OTA task creation
- **[mqtt_handler.c:572-619](../hardware/obedio-esp-idf/main/mqtt_handler.c#L572-L619)**: MQTT OTA trigger handling

### Implementation Details

#### OTA Trigger (MQTT)
```c
// Device subscribes to: obedio/button/{DEVICE_ID}/ota
// Example topic: obedio/button/BTN-6DB9AC/ota

// MQTT payload format:
{
  "url": "http://10.10.0.10:3000/firmware.bin"
}
```

**Code Location**: [mqtt_handler.c:572-619](../hardware/obedio-esp-idf/main/mqtt_handler.c#L572-L619)

#### OTA Process Flow
1. **MQTT Message Received** → Parse URL from JSON
2. **Create OTA Task** → 8KB stack, priority 5
3. **Stop LED Task** → Prevent flash cache conflicts
4. **Download Firmware** → HTTP GET with 120s timeout
5. **Validate & Flash** → ESP-IDF validates image
6. **Set Boot Partition** → Switch to new partition
7. **Send Offline Status** → MQTT message before reboot
8. **Reboot** → Boot into new firmware

**Code Locations**:
- OTA Task: [mqtt_handler.c:56-88](../hardware/obedio-esp-idf/main/mqtt_handler.c#L56-L88)
- HTTP Download: [ota_handler.c:245-297](../hardware/obedio-esp-idf/main/ota_handler.c#L245-L297)

#### HTTP Configuration
```c
// HTTP client config (NOT HTTPS)
esp_http_client_config_t config = {
    .url = url,                              // From MQTT message
    .transport_type = HTTP_TRANSPORT_OVER_TCP,  // Plain HTTP
    .timeout_ms = 120000,                    // 2 minute timeout
    .keep_alive_enable = true,
    .buffer_size = 4096,
};
```

**Code Location**: [ota_handler.c:256-263](../hardware/obedio-esp-idf/main/ota_handler.c#L256-L263)

#### Rollback Protection
```c
// ESP-IDF automatic rollback if new firmware doesn't validate
CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE=y  // In sdkconfig.defaults

// Validation happens in main.c early boot (lines 330-368)
// If firmware boots successfully, it's marked as valid
esp_ota_mark_app_valid_cancel_rollback();
```

**Configuration**: [sdkconfig.defaults:118](../hardware/obedio-esp-idf/sdkconfig.defaults#L118)

#### Partition Table (supports OTA)
```csv
# partitions.csv
otadata,     data, ota,      0x10000,  0x2000,     # OTA data partition
ota_0,       app,  ota_0,    ,         0x180000,   # First app slot (1.5MB)
ota_1,       app,  ota_1,    ,         0x180000,   # Second app slot (1.5MB)
```

**File**: [partitions.csv:9-11](../hardware/obedio-esp-idf/partitions.csv#L9-L11)

### LED Indicators
| LED Color | Meaning |
|-----------|---------|
| Purple Flash | OTA download starting |
| Green Flash | Successful boot after OTA |
| Red Flash | OTA failed |

**Code Location**: [mqtt_handler.c:576](../hardware/obedio-esp-idf/main/mqtt_handler.c#L576)

### Deployment Script
Located at: `/Users/nicolas/vibecoding/obedio/deploy_ota_firmware.sh`

Manual deployment:
```bash
# 1. Build
idf.py build

# 2. Upload to NUC
scp build/obedio-button.bin obedio@10.10.0.10:~/firmware.bin

# 3. Copy to frontend container
ssh obedio@10.10.0.10 "docker cp ~/firmware.bin obedio-frontend:/usr/share/nginx/html/firmware.bin"

# 4. Trigger OTA
ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_pub -h localhost -t "obedio/button/BTN-6DB9AC/ota" -m "{\"url\": \"http://10.10.0.10:3000/firmware.bin\"}"'
```

---

## 3. MQTT Light Control

### Overview
The T3 button (aux2) publishes MQTT commands to control external devices (e.g., Tasmota smart lights). Topic and payload are runtime-configurable.

### Key Files
- **[mqtt_handler.c:991-1012](../hardware/obedio-esp-idf/main/mqtt_handler.c#L991-L1012)**: Tasmota toggle function
- **[mqtt_handler.c:43-44](../hardware/obedio-esp-idf/main/mqtt_handler.c#L43-L44)**: Default topic/payload
- **[config.h:283-284](../hardware/obedio-esp-idf/main/config.h#L283-L284)**: NVS storage keys

### Default Configuration
```c
// Default values (can be changed via MQTT config/set)
.t3_topic = "tasmota_obedio/cmnd/POWER",
.t3_payload = "TOGGLE",
```

**Code Location**: [mqtt_handler.c:43-44](../hardware/obedio-esp-idf/main/mqtt_handler.c#L43-L44)

### MQTT Light Control Flow
1. **User presses T3 button** (short press)
2. **Button handler** calls → `mqtt_publish_tasmota_toggle()`
3. **Publishes MQTT message**:
   - **Topic**: `tasmota_obedio/cmnd/POWER` (configurable)
   - **Payload**: `TOGGLE` (configurable)
   - **QoS**: 1 (at least once delivery)

**Code Location**: [mqtt_handler.c:991-1012](../hardware/obedio-esp-idf/main/mqtt_handler.c#L991-L1012)

### Runtime Configuration (via MQTT)
```json
// Publish to: obedio/button/{DEVICE_ID}/config/set
{
  "t3Topic": "custom/light/topic",
  "t3Payload": "ON"
}
```

**Code Location**: [mqtt_handler.c:482-497](../hardware/obedio-esp-idf/main/mqtt_handler.c#L482-L497)

### MQTT Broker Connection
```c
// Default broker (can be overridden via NVS)
#define MQTT_BROKER_URI "mqtt://10.10.0.10:1883"

// LWT (Last Will and Testament) configured
// Topic: obedio/button/{DEVICE_ID}/status
// Payload: {"status":"offline","deviceId":"...","reason":"connection_lost"}
```

**Code Locations**:
- Broker URI: [config.h:47](../hardware/obedio-esp-idf/main/config.h#L47)
- LWT Setup: [mqtt_handler.c:688-708](../hardware/obedio-esp-idf/main/mqtt_handler.c#L688-L708)

### MQTT Topics Summary
| Topic Pattern | Direction | Purpose |
|---------------|-----------|---------|
| `obedio/device/register` | Publish | Device registration on startup |
| `obedio/device/heartbeat` | Publish | Periodic status (every 30s) |
| `obedio/button/{ID}/press` | Publish | Button press events |
| `obedio/button/{ID}/voice` | Publish | Voice recordings (disabled) |
| `obedio/button/{ID}/status` | Publish | Online/offline status (LWT) |
| `obedio/button/{ID}/ota` | Subscribe | OTA update trigger |
| `obedio/button/{ID}/config/set` | Subscribe | Runtime configuration |
| `obedio/button/{ID}/config/status` | Publish | Current configuration |
| `tasmota_obedio/cmnd/POWER` | Publish | Light control (T3 button) |

**Code Locations**: [config.h:292-296](../hardware/obedio-esp-idf/main/config.h#L292-L296)

---

## 4. Build & Flash Commands

### Prerequisites
- **ESP-IDF Version**: v5.1.2 (required)
- **Target**: ESP32-S3
- **Python**: 3.8+ (installed with ESP-IDF)
- **Git**: For cloning repository

### ESP-IDF Installation

#### Windows
```powershell
# Download and run installer:
# https://dl.espressif.com/dl/esp-idf/esp-idf-tools-setup-offline-5.1.2.exe

# After installation, use "ESP-IDF 5.1 PowerShell" for all commands
```

**Guide**: [WINDOWS_SETUP.md](../hardware/obedio-esp-idf/WINDOWS_SETUP.md)

#### Linux/Mac
```bash
git clone --recursive https://github.com/espressif/esp-idf.git
cd esp-idf
git checkout v5.1.2
./install.sh esp32s3
source export.sh
```

**Guide**: [README.md:72-79](../hardware/obedio-esp-idf/README.md#L72-L79)

### Build Commands

```bash
# Navigate to project
cd hardware/obedio-esp-idf

# Set up environment (run in each new terminal)
source ~/esp/esp-idf/export.sh  # Linux/Mac
# OR use "ESP-IDF 5.1 PowerShell" on Windows

# Optional: Configure project (defaults are pre-set)
idf.py menuconfig

# Build firmware
idf.py build

# Output: build/obedio-button.bin
```

**Reference**: [README.md:83-99](../hardware/obedio-esp-idf/README.md#L83-L99)

### Flash Commands

```bash
# Linux/Mac
idf.py -p /dev/ttyACM0 flash

# Windows
idf.py -p COM3 flash
# (Replace COM3 with your device's COM port)

# Flash + Monitor (see serial output)
idf.py -p /dev/ttyACM0 flash monitor

# Monitor only (after flashing)
idf.py monitor

# Exit monitor: Ctrl+]
```

**Common Serial Ports**:
- Linux: `/dev/ttyUSB0`, `/dev/ttyACM0`
- Mac: `/dev/cu.usbserial-*`
- Windows: `COM3`, `COM4`, `COM5`

### Erase Flash (Factory Reset)
```bash
idf.py -p /dev/ttyACM0 erase-flash
```

### Build Artifacts
```
build/
├── obedio-button.bin          # Main firmware binary (for OTA)
├── bootloader/
│   └── bootloader.bin         # Bootloader (initial flash only)
├── partition_table/
│   └── partition-table.bin    # Partition table
└── ota_data_initial.bin       # OTA data partition
```

---

## 5. Dependencies

### ESP-IDF Version
**Required**: ESP-IDF v5.1.2 (or v5.1.x)

**Reason**: Project uses newer I2C master API and other v5.1+ features.

### ESP-IDF Components (Built-in)
These are part of ESP-IDF and configured in `sdkconfig.defaults`:

| Component | Purpose | Configuration |
|-----------|---------|---------------|
| `esp_wifi` | WiFi connectivity | 2.4GHz, 10 static RX buffers, 32 dynamic |
| `esp_http_client` | OTA downloads | 4KB buffer, 120s timeout |
| `mqtt` | MQTT protocol | 4KB buffer, QoS 0/1 support |
| `lwip` | TCP/IP stack | 16 sockets, TCP MSS 1440 |
| `mdns` | mDNS discovery | Max 10 services |
| `nvs_flash` | Non-volatile storage | Configuration persistence |
| `esp_ota` | OTA updates | Rollback protection enabled |
| `driver` | Hardware drivers | I2C, I2S, RMT, Touch |
| `led_strip` | WS2812B control | RMT-based, 10MHz resolution |
| `freertos` | RTOS kernel | Dual-core, 1000 Hz tick |
| `cJSON` | JSON parsing | MQTT message handling |
| `mbedtls` | Crypto/TLS | Base64 encoding for audio |

### Custom Components
Located in `components/` directory:

| Component | Type | Purpose | Dependencies |
|-----------|------|---------|--------------|
| `mcp23017` | Hardware Driver | I2C GPIO expander (6 buttons) | I2C master API |
| `lis3dhtr` | Hardware Driver | I2C accelerometer (shake detection) | I2C master API |
| `led_effects` | Library | LED animation effects | `led_strip` |
| `adpcm_codec` | Library | Audio compression (IMA ADPCM) | None |

**Files**: See project structure section above

### External Dependencies (idf_component.yml)
```yaml
# main/idf_component.yml
dependencies:
  espressif/led_strip: "^2.5.0"  # WS2812B NeoPixel driver
```

**File**: [main/idf_component.yml](../hardware/obedio-esp-idf/main/idf_component.yml)

### Hardware Dependencies
- **ESP32-S3-WROOM-1**: 8MB Flash, 2MB PSRAM
- **MCP23017**: I2C GPIO expander (address 0x20)
- **LIS3DHTR**: I2C accelerometer (address 0x19)
- **WS2812B**: Addressable RGB LEDs (16 LEDs)
- **INMP441**: I2S MEMS microphone (disabled)
- **MAX98357A**: I2S amplifier (disabled)

---

## 6. GPIO Pin Mapping

### I2C Bus (Hardware Peripherals)
| Pin | Function | Device | Notes |
|-----|----------|--------|-------|
| GPIO2 | I2C SCL | MCP23017, LIS3DHTR | 100 kHz clock |
| GPIO3 | I2C SDA | MCP23017, LIS3DHTR | Internal pull-ups enabled |

**Code Location**: [config.h:62-75](../hardware/obedio-esp-idf/main/config.h#L62-L75)

### I2C Device Addresses
| Device | Address | Purpose |
|--------|---------|---------|
| MCP23017 | 0x20 | GPIO expander for 6 buttons |
| LIS3DHTR | 0x19 | Accelerometer for shake detection |

**Code Location**: [config.h:78-79](../hardware/obedio-esp-idf/main/config.h#L78-L79)

### MCP23017 Button Mapping (via I2C)
The 6 physical buttons are connected to MCP23017 GPA bank:

| Button | MCP Pin | Function | Short Press | Long Press (>700ms) |
|--------|---------|----------|-------------|---------------------|
| T1 | GPA7 | Main | Service request | Voice recording |
| T2 | GPA6 | Aux1 | Call service | - |
| T3 | GPA5 | Aux2 | **Light control (MQTT)** | - |
| T4 | GPA4 | Aux3 | Prepare food | - |
| T5 | GPA3 | Aux4 | Bring drinks | - |
| T6 | GPA0 | Aux5 | Toggle DND | Factory reset (on boot) |

**Code Location**: [config.h:85-100](../hardware/obedio-esp-idf/main/config.h#L85-L100)

### LED Control
| Pin | Function | Device | Configuration |
|-----|----------|--------|---------------|
| GPIO17 | LED Data | WS2812B (16 LEDs) | RMT driver, 10MHz |

**Code Location**: [config.h:122-126](../hardware/obedio-esp-idf/main/config.h#L122-L126)

### Touch Sensor
| Pin | Function | Type | Notes |
|-----|----------|------|-------|
| GPIO1 | Touch Pad | Capacitive | ESP32-S3 touch peripheral |

**Code Location**: [config.h:162-166](../hardware/obedio-esp-idf/main/config.h#L162-L166)

### I2S Microphone (INMP441) - DISABLED
| Pin | Function | Signal | Notes |
|-----|----------|--------|-------|
| GPIO33 | I2S BCK | Bit Clock | Currently disabled |
| GPIO38 | I2S WS | Word Select | Causes watchdog timeout |
| GPIO34 | I2S DATA | Audio Data | See audio_recorder.c |

**Code Location**: [config.h:212-230](../hardware/obedio-esp-idf/main/config.h#L212-L230)

### I2S Speaker (MAX98357A) - DISABLED
| Pin | Function | Signal | Notes |
|-----|----------|--------|-------|
| GPIO10 | I2S BCK | Bit Clock | Currently disabled |
| GPIO18 | I2S WS | Word Select | Web server heap issues |
| GPIO11 | I2S DATA | Audio Data | See web_server.c |
| GPIO14 | ENABLE | Amplifier Enable | - |

**Code Location**: [config.h:232-257](../hardware/obedio-esp-idf/main/config.h#L232-L257)

### Pin Summary Table
| GPIO | Function | Device/Signal | Status |
|------|----------|---------------|--------|
| 1 | Touch Sensor | Capacitive Touch | **Active** |
| 2 | I2C SCL | MCP23017 + LIS3DHTR | **Active** |
| 3 | I2C SDA | MCP23017 + LIS3DHTR | **Active** |
| 10 | I2S BCK | Speaker | Disabled |
| 11 | I2S DATA | Speaker | Disabled |
| 14 | Enable | Speaker Amp | Disabled |
| 17 | LED Data | WS2812B (16 LEDs) | **Active** |
| 18 | I2S WS | Speaker | Disabled |
| 33 | I2S BCK | Microphone | Disabled |
| 34 | I2S DATA | Microphone | Disabled |
| 38 | I2S WS | Microphone | Disabled |

---

## 7. Configuration Files

### CMakeLists.txt (Project Root)
```cmake
cmake_minimum_required(VERSION 3.16)
include($ENV{IDF_PATH}/tools/cmake/project.cmake)
project(obedio-button)
```

**File**: [CMakeLists.txt](../hardware/obedio-esp-idf/CMakeLists.txt)

### sdkconfig.defaults (Key Settings)
```ini
# Target
CONFIG_IDF_TARGET="esp32s3"

# Flash
CONFIG_ESPTOOLPY_FLASHSIZE_8MB=y
CONFIG_ESPTOOLPY_FLASHMODE_QIO=y
CONFIG_ESPTOOLPY_FLASHFREQ_80M=y

# PSRAM
CONFIG_SPIRAM=y
CONFIG_SPIRAM_MODE_OCT=y
CONFIG_SPIRAM_SPEED_80M=y

# OTA
CONFIG_PARTITION_TABLE_CUSTOM=y
CONFIG_PARTITION_TABLE_CUSTOM_FILENAME="partitions.csv"
CONFIG_BOOTLOADER_APP_ROLLBACK_ENABLE=y
CONFIG_OTA_ALLOW_HTTP=y

# WiFi
CONFIG_ESP_WIFI_STATIC_RX_BUFFER_NUM=10
CONFIG_ESP_WIFI_DYNAMIC_RX_BUFFER_NUM=32

# MQTT
CONFIG_MQTT_BUFFER_SIZE=4096

# Watchdog
CONFIG_ESP_TASK_WDT_TIMEOUT_S=10
CONFIG_ESP_INT_WDT_TIMEOUT_MS=800
```

**File**: [sdkconfig.defaults](../hardware/obedio-esp-idf/sdkconfig.defaults)

### partitions.csv (Flash Layout)
```csv
# Name,      Type, SubType,  Offset,   Size
nvs,         data, nvs,      0x9000,   0x6000,    # Config storage
phy_init,    data, phy,      0xf000,   0x1000,    # WiFi calibration
otadata,     data, ota,      0x10000,  0x2000,    # OTA metadata
ota_0,       app,  ota_0,    ,         0x180000,  # App slot 1 (1.5MB)
ota_1,       app,  ota_1,    ,         0x180000,  # App slot 2 (1.5MB)
spiffs,      data, spiffs,   ,         0x200000,  # Web files (2MB)
coredump,    data, coredump, ,         64K,       # Crash dumps
```

**Total App Size**: 1.5MB per OTA partition
**File**: [partitions.csv](../hardware/obedio-esp-idf/partitions.csv)

---

## 8. Runtime Configuration (NVS Storage)

### Configurable Parameters
All settings can be changed at runtime via MQTT and persist across reboots:

| Parameter | NVS Key | Type | Range | Default | MQTT Field |
|-----------|---------|------|-------|---------|------------|
| Heartbeat Interval | `hb_interval` | uint32 | 5-300 sec | 30s | `heartbeatInterval` |
| Sleep Timeout | `sleep_timeout` | uint32 | 10-300 sec | 30s | `sleepTimeout` |
| Long Press Threshold | `long_press_ms` | uint32 | 200-2000 ms | 700ms | `longPressThreshold` |
| T3 MQTT Topic | `t3_topic` | string | - | `tasmota_obedio/cmnd/POWER` | `t3Topic` |
| T3 MQTT Payload | `t3_payload` | string | - | `TOGGLE` | `t3Payload` |
| LED Brightness | `led_bright` | uint8 | 0-255 | 200 | `ledBrightness` |
| LED Red | `led_red` | uint8 | 0-255 | 255 | `ledRed` |
| LED Green | `led_green` | uint8 | 0-255 | 0 | `ledGreen` |
| LED Blue | `led_blue` | uint8 | 0-255 | 0 | `ledBlue` |
| Shake Threshold | `shake_thresh` | uint8 | 0-100 | 8.0G | `shakeThreshold` |
| Touch Threshold | `touch_thresh` | uint8 | 0-100 | 80% | `touchThreshold` |

**Code Locations**:
- NVS Keys: [config.h:269-286](../hardware/obedio-esp-idf/main/config.h#L269-L286)
- Load Function: [mqtt_handler.c:151-240](../hardware/obedio-esp-idf/main/mqtt_handler.c#L151-L240)
- Save Function: [mqtt_handler.c:245-289](../hardware/obedio-esp-idf/main/mqtt_handler.c#L245-L289)

### Configuration Update Example
```bash
# Publish to: obedio/button/{DEVICE_ID}/config/set
mosquitto_pub -h 10.10.0.10 -t "obedio/button/BTN-6DB9AC/config/set" -m '{
  "heartbeatInterval": 60,
  "t3Topic": "custom/light/topic",
  "t3Payload": "ON",
  "ledBrightness": 150,
  "ledRed": 0,
  "ledGreen": 0,
  "ledBlue": 255
}'
```

**Guide**: [CONFIGURATION_GUIDE.md](../hardware/obedio-esp-idf/CONFIGURATION_GUIDE.md)

---

## 9. Important Notes

### Working Features (v3.0-esp-idf)
- 6 physical buttons (T1-T6) with short/long press detection
- Capacitive touch sensor
- MQTT integration with all button events
- LED animations (WS2812B control)
- WiFi connection and mDNS discovery
- OTA firmware updates via MQTT
- Runtime configuration via MQTT
- Accelerometer shake detection
- NVS configuration persistence

### Disabled Features
These features have code implemented but are disabled:
1. **Voice Recording** ([audio_recorder.c](../hardware/obedio-esp-idf/main/audio_recorder.c)) - Causes watchdog timeout
2. **Web Interface** ([web_server.c](../hardware/obedio-esp-idf/main/web_server.c)) - Causes heap corruption

**Status Details**: [WORKING_STATUS.md](../hardware/obedio-esp-idf/WORKING_STATUS.md)

### Security Notes
1. **MQTT**: No authentication configured (local network only)
2. **OTA**: Uses HTTP, not HTTPS (faster, but no encryption)
3. **WiFi**: WPA2 password stored in NVS (encrypted if enabled)
4. **Web**: Disabled (would be HTTP without authentication)

### Memory Usage
- **Flash**: ~1.2MB firmware (1.5MB available per OTA slot)
- **SRAM**: ~150KB used (512KB total)
- **PSRAM**: Available for large buffers (2MB)
- **Heap**: ~7.6MB free (includes PSRAM)

### Network Configuration
- **WiFi SSID**: "Obedio" (default, changeable via NVS)
- **WiFi Password**: "BrankomeinBruder:)" (default)
- **MQTT Broker**: mqtt://10.10.0.10:1883
- **mDNS Hostname**: obedio-{MAC}.local (e.g., obedio-6db9ac.local)

**Default Credentials**: [config.h:26-50](../hardware/obedio-esp-idf/main/config.h#L26-L50)

---

## 10. Migration Checklist

If migrating this project to a new environment or device:

- [ ] Install ESP-IDF v5.1.2
- [ ] Clone repository and checkout `deployment-fixes` branch
- [ ] Update WiFi credentials in NVS or [config.h:28-36](../hardware/obedio-esp-idf/main/config.h#L28-L36)
- [ ] Update MQTT broker URI in NVS or [config.h:47](../hardware/obedio-esp-idf/main/config.h#L47)
- [ ] Update OTA firmware hosting URL (default: http://10.10.0.10:3000/firmware.bin)
- [ ] Verify I2C devices (MCP23017 at 0x20, LIS3DHTR at 0x19)
- [ ] Verify GPIO pin connections match [config.h](../hardware/obedio-esp-idf/main/config.h)
- [ ] Build and flash firmware: `idf.py build flash monitor`
- [ ] Test button presses via MQTT subscription: `mosquitto_sub -h 10.10.0.10 -t 'obedio/#' -v`
- [ ] Test T3 light control MQTT publishing
- [ ] Test OTA update process
- [ ] Verify mDNS discovery: `ping obedio-{MAC}.local`

---

## 11. References

### Documentation Files
- [README.md](../hardware/obedio-esp-idf/README.md) - Main project documentation
- [OTA_UPDATE_GUIDE.md](../hardware/obedio-esp-idf/OTA_UPDATE_GUIDE.md) - OTA deployment
- [WINDOWS_SETUP.md](../hardware/obedio-esp-idf/WINDOWS_SETUP.md) - Windows build setup
- [CONFIGURATION_GUIDE.md](../hardware/obedio-esp-idf/CONFIGURATION_GUIDE.md) - Runtime configuration
- [WORKING_STATUS.md](../hardware/obedio-esp-idf/WORKING_STATUS.md) - Feature status
- [DEBUG_OTA_ROLLBACK.md](../hardware/obedio-esp-idf/DEBUG_OTA_ROLLBACK.md) - OTA debugging
- [PROJECT_SUMMARY.md](../hardware/obedio-esp-idf/PROJECT_SUMMARY.md) - Architecture overview

### External Resources
- **ESP-IDF Documentation**: https://docs.espressif.com/projects/esp-idf/en/v5.1.2/
- **ESP32-S3 Datasheet**: https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf
- **MCP23017 Datasheet**: https://ww1.microchip.com/downloads/en/devicedoc/20001952c.pdf
- **LIS3DHTR Datasheet**: https://www.st.com/resource/en/datasheet/lis3dh.pdf
- **WS2812B Datasheet**: https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf

---

**Document Generated**: November 17, 2025
**Analyzer**: Claude (Anthropic)
**Purpose**: Complete ESP-IDF project analysis for migration/deployment reference
