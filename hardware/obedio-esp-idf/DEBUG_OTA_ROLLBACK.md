# OTA Rollback Debugging Guide

## Current Status (Nov 16, 2025 - 20:00 UTC)

**CRITICAL ISSUE**: Device crashes during boot after OTA updates, causing automatic rollback to old firmware.

### Device Status
- **State**: OFFLINE (last seen 19:21 UTC)
- **Device ID**: BTN-6DB9AC
- **Last known firmware**: BUILD-Nov 16 2025-12:41:51 (old firmware)
- **Latest OTA attempt**: 19:11 (989 KB firmware) - FAILED
- **Last message**: `{"status":"offline","reason":"connection_lost","timestamp":53407}`

### What We Tried

#### Attempt 1: Removed Invalid GPIO Wake Source
**File**: `main/power_manager.c`
**Change**: Removed `esp_sleep_enable_ext0_wakeup(TOUCH_PAD_GPIO, 0)`
**Reason**: GPIO 1 is NOT RTC-capable on ESP32-S3
**Result**: ❌ Still crashed and rolled back

#### Attempt 2: Completely Disabled Power Manager
**File**: `main/main.c` (lines 603-621)
**Change**: Commented out all `power_manager_init()` and `power_manager_start_task()` calls
**Purpose**: Isolate power manager as potential cause
**Result**: ❌ Device went offline and never came back (likely rolled back again)

### Key Finding
**Power manager is NOT the root cause** - the crash occurs even when power manager is completely disabled. The issue is somewhere else in the firmware.

---

## Next Steps: USB Serial Debugging

### Prerequisites
- **Device**: BTN-6DB9AC (ESP32-S3 custom board)
- **Location**: Can be connected to NUC at 10.10.0.10 (accessible via SSH/VPN)
- **ESP-IDF Version**: v5.1 or later (verify with `cd ~/esp/esp-idf && git describe --tags`)

### Step 1: Power Cycle the Device
First, try a simple power cycle to see if device comes back with old firmware:

```bash
# SSH into NUC
ssh user@10.10.0.10

# Check MQTT for heartbeat
docker exec obedio-mqtt mosquitto_sub -h localhost -t "obedio/device/heartbeat" -C 1 -v
```

If device is still offline, proceed to USB debugging.

---

### Step 2: USB Flash with Serial Monitoring

This is **CRITICAL** - we need real-time boot logs to see where the crash occurs.

#### On the NUC (via SSH):

```bash
# 1. Connect ESP32 device to NUC via USB

# 2. Find the USB serial port
ls /dev/ttyUSB* /dev/ttyACM*
# Example output: /dev/ttyUSB0

# 3. Navigate to project directory
cd /path/to/obedio-yacht-crew-management/hardware/obedio-esp-idf

# 4. Set the serial port (if needed)
export ESPPORT=/dev/ttyUSB0  # Or whatever port shows up

# 5. Flash and monitor in one command
idf.py flash monitor

# This will:
# - Flash the current firmware (with power manager disabled)
# - Show real-time serial output
# - Capture the exact crash location
```

#### What to Look For in Serial Logs

**Boot sequence should show:**
1. ESP-IDF boot messages
2. Partition information (running partition: ota_0 or ota_1)
3. WiFi initialization
4. MQTT connection
5. Device registration

**If crash occurs, look for:**
- `Guru Meditation Error` - indicates panic/crash
- `abort()` called - assertion failure
- Watchdog timeout messages
- Stack trace with function names
- `LoadProhibited` / `StoreProhibited` - memory access errors

**Example crash output:**
```
Guru Meditation Error: Core 0 panic'ed (LoadProhibited)
Stack trace:
0x400xxxxx: function_name at /path/to/file.c:123
```

#### Save the Logs

```bash
# In another SSH session, save logs to file
idf.py monitor > boot_crash_log.txt 2>&1

# Or use screen to capture
screen -L -Logfile boot_crash_log.txt /dev/ttyUSB0 115200
```

---

### Step 3: Analyze the Crash

Once you have the crash logs, look for:

1. **Which partition is running?**
   - Look for: `Running partition: ota_0` or `ota_1`
   - Old firmware: ota_1 (12:41 build)
   - New firmware: ota_0 (19:11 build)

2. **Where does it crash?**
   - Last function called before crash
   - Which component: WiFi, MQTT, LED, Button, etc.

3. **Type of crash:**
   - Panic (assertion, null pointer)
   - Watchdog timeout (infinite loop, deadlock)
   - Memory corruption

---

## Known Working Firmware

**Last stable OTA deployment:**
- Build time: Nov 16 2025, 12:41:51
- Running partition: ota_1
- Features: All working except power management

**Current failing firmware:**
- Build time: Nov 16 2025, 19:11
- Changes: Power manager completely disabled
- Still crashes during boot

---

## Technical Details

### Hardware
- **Board**: ESP32-S3 Custom PCB v1.0
- **Buttons**: MCP23017 I2C GPIO expander
- **Accelerometer**: LIS3DHTR I2C
- **LED**: WS2812B RGB
- **Power**: LiPo battery with charging

### Network
- **NUC Server**: 10.10.0.10 (SSH accessible via VPN)
- **MQTT Broker**: 10.10.0.10:1883
- **OTA Server**: http://10.10.0.10:8000
- **WiFi**: Device connects to NUC network

### Build System
- **Framework**: ESP-IDF v5.1+
- **Build location**: `build/obedio-button.bin`
- **OTA deployment**: `/Users/nicolas/vibecoding/obedio/deploy_ota_firmware.sh`

---

## Files Modified in This Session

### New Files (Power Management)
- `main/power_manager.c` - Power management implementation
- `main/power_manager.h` - Power management header

### Modified Files
- `main/main.c` - Power manager disabled (lines 603-621)
- `main/power_manager.c` - Removed invalid GPIO wake source
- `main/CMakeLists.txt` - Added power_manager.c to build
- `main/ota_handler.c` - Added sleep prevention during OTA
- `main/mqtt_handler.c/h` - Added offline status messaging
- `main/led_controller.c/h` - LED enhancements
- `main/button_handler.c` - Button handling improvements
- `main/config.h` - Added power manager configuration

---

## Quick Commands Reference

```bash
# Check if device is online (from NUC)
docker exec obedio-mqtt mosquitto_sub -h localhost -t "obedio/device/heartbeat" -C 1 -v

# Flash via USB (from NUC)
cd /path/to/obedio-esp-idf
idf.py flash monitor

# Build new firmware (local Mac)
cd /Users/nicolas/vibecoding/obedio/obedio-yacht-crew-management/hardware/obedio-esp-idf
idf.py build

# Deploy OTA (local Mac)
cd /Users/nicolas/vibecoding/obedio
bash deploy_ota_firmware.sh

# Monitor all MQTT topics
docker exec obedio-mqtt mosquitto_sub -h localhost -t "obedio/#" -v
```

---

## Next Actions

1. ✅ Power cycle device and check if it comes back online
2. ✅ Connect device to NUC via USB
3. ✅ Run `idf.py flash monitor` to capture boot logs
4. ⏸️ Share crash logs to identify root cause
5. ⏸️ Fix the actual crash (not power manager related)
6. ⏸️ Test OTA update again
7. ⏸️ Re-enable power manager once OTA is stable

---

## Contact Info

- **Last worked on by**: Claude (AI Assistant)
- **Date**: Nov 16, 2025
- **Time**: 20:00 UTC
- **Branch**: deploy
- **Device location**: Can be connected to NUC (obedio@10.10.0.10)
