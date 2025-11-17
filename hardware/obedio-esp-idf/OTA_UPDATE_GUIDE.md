# OTA (Over-The-Air) Update Guide

## Overview

The OBEDIO button device supports wireless firmware updates via MQTT-triggered OTA. This allows you to update the device firmware without physical access to the serial port.

## How It Works

1. **Build** new firmware on your development machine
2. **Upload** firmware to NUC's web server
3. **Trigger** OTA update via MQTT message
4. **Device** downloads, flashes, and reboots automatically

## Architecture

```
[Dev Machine] --SCP--> [NUC Docker Frontend] --HTTP--> [ESP32 Device]
                              |
                         [MQTT Broker]
                              |
                         [OTA Trigger]
```

- **Firmware Hosting**: NUC frontend container (NGINX) serves firmware.bin at `http://10.10.0.10:3000/firmware.bin`
- **MQTT Trigger**: Device subscribes to `obedio/button/{DEVICE_ID}/ota` topic
- **OTA Handler**: Dedicated task downloads firmware with 120s timeout
- **Safety**: ESP-IDF rollback protection prevents bricking

## Prerequisites

1. **ESP-IDF 5.1.2** installed and configured
2. **SSH access** to NUC (`ssh obedio@10.10.0.10`)
3. **Device** connected to WiFi and MQTT broker
4. **Deployment script** in `/Users/nicolas/vibecoding/obedio/deploy_ota_firmware.sh`

## Quick Start

### Option 1: Using Deployment Script (Recommended)

```bash
cd /Users/nicolas/vibecoding/obedio
bash deploy_ota_firmware.sh
```

This script automatically:
- Uploads firmware to NUC
- Copies to frontend container
- Publishes MQTT OTA command

### Option 2: Manual Deployment

```bash
# 1. Build firmware
cd obedio-yacht-crew-management/hardware/obedio-esp-idf
source ~/esp/esp-idf/export.sh
idf.py build

# 2. Upload to NUC
scp build/obedio-button.bin obedio@10.10.0.10:~/firmware.bin

# 3. Copy to frontend container
ssh obedio@10.10.0.10 "docker cp ~/firmware.bin obedio-frontend:/usr/share/nginx/html/firmware.bin"

# 4. Trigger OTA via MQTT
ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_pub -h localhost -t "obedio/button/BTN-6DB9AC/ota" -m "{\"url\": \"http://10.10.0.10:3000/firmware.bin\"}"'
```

## LED Indicators

| LED Color | Meaning |
|-----------|---------|
| 🟣 Purple Flash | OTA update starting (download initiated) |
| ⚪ White Circle | Normal operation |
| 🟢 Green Flash | Successful boot after update |
| 🔴 Red Flash | OTA update failed |

## Device Topics

- **Subscribe**: `obedio/button/{DEVICE_ID}/ota`
- **Payload Format**:
  ```json
  {
    "url": "http://10.10.0.10:3000/firmware.bin"
  }
  ```

## Firmware Configuration

### OTA Settings (main/ota_handler.c)

```c
.timeout_ms = 120000,  // 120 second timeout (2 minutes)
.buffer_size = 4096,
.buffer_size_tx = 4096,
.skip_cert_common_name_check = true,  // Allow HTTP (not HTTPS)
```

### OTA Task (main/mqtt_handler.c)

```c
xTaskCreate(
    ota_task,
    "ota_task",
    8192,  // 8KB stack to avoid watchdog timeout
    url_copy,
    5,  // High priority
    NULL
);
```

## Troubleshooting

### OTA Update Not Starting

**Symptoms**: No purple LED flash after MQTT command

**Solutions**:
1. Check device is connected to MQTT:
   ```bash
   ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_sub -h localhost -t "obedio/button/BTN-6DB9AC/#" -v'
   ```

2. Verify device subscription:
   - Check serial output for "Subscribed to OTA topic" message

3. Test MQTT publish manually:
   ```bash
   ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_pub -h localhost -t "obedio/button/BTN-6DB9AC/ota" -m "{\"url\": \"http://10.10.0.10:3000/firmware.bin\"}"'
   ```

### OTA Download Failing

**Symptoms**: Purple flash, then quick reboot, stays on old firmware

**Solutions**:
1. Verify firmware is accessible:
   ```bash
   ssh obedio@10.10.0.10 "curl -I http://localhost:3000/firmware.bin"
   ```
   Should return `HTTP/1.1 200 OK` and size ~990 KB

2. Check firmware file exists in container:
   ```bash
   ssh obedio@10.10.0.10 "docker exec obedio-frontend ls -lh /usr/share/nginx/html/firmware.bin"
   ```

3. Monitor serial output for error messages:
   ```bash
   python3 /Users/nicolas/vibecoding/obedio/check_device_long.py
   ```

### HTTP vs HTTPS Issue

Currently configured for **HTTP only** (port 3000).
ESP-IDF `esp_https_ota()` function works with both HTTP and HTTPS when `skip_cert_common_name_check = true`.

If using HTTPS:
1. Set URL to `https://10.10.0.10:PORT/firmware.bin`
2. Add certificate validation or disable with `.skip_cert_common_name_check = true`

### Rollback Protection

ESP-IDF automatically rolls back if new firmware doesn't boot successfully within the watchdog timeout.

**To verify rollback worked**:
- Check running partition: Serial output shows "Running partition: ota_0" or "ota_1"
- Old firmware continues running = rollback successful

## Development Workflow

### Testing OTA Updates

1. **Make LED color change** (easy visual verification):
   ```c
   // led_controller.c line 152
   led_strip_set_pixel(led_strip, position, 0, 50, 128);  // Blue
   ```

2. **Build and deploy**:
   ```bash
   idf.py build && bash /Users/nicolas/vibecoding/obedio/deploy_ota_firmware.sh
   ```

3. **Watch device**: Purple flash → 30-60 seconds → Green flash → Blue LEDs

### Debugging OTA Issues

1. **Enable serial monitor before OTA**:
   ```bash
   python3 /Users/nicolas/vibecoding/obedio/check_device_long.py
   ```

2. **Watch for log messages**:
   ```
   OTA: OTA update request received!
   OTA: Firmware URL: http://10.10.0.10:3000/firmware.bin
   OTA: OTA task started
   OTA: Starting download...
   OTA: Download completed with result: ESP_OK
   OTA: Rebooting in 3 seconds...
   ```

3. **Check error codes**:
   - `ESP_ERR_TIMEOUT`: Network timeout (increase timeout_ms)
   - `ESP_ERR_OTA_VALIDATE_FAILED`: Firmware validation failed
   - `ESP_FAIL`: General failure (check URL, network)

## Wireless Debugging (UDP Logging)

**Status**: Framework implemented, not yet working

The firmware includes UDP logging support to stream logs wirelessly:

```c
// Logs sent to: 10.10.0.10:5555 (UDP)
init_udp_logging("10.10.0.10", 5555);
```

**To receive logs** (when working):
```bash
ssh obedio@10.10.0.10 "nc -ul 5555"
```

## Files Modified for OTA

| File | Changes |
|------|---------|
| `main/ota_handler.c` | Added `ota_update_from_url()` with HTTP client config |
| `main/ota_handler.h` | Added function declaration |
| `main/mqtt_handler.c` | Subscribe to `/ota` topic, create OTA task |
| `main/main.c` | Initialize OTA handler, added UDP logging framework |
| `deploy_ota_firmware.sh` | Automated deployment script |

## Security Considerations

⚠️ **Current Setup**: No authentication on OTA endpoint

**Improvements for Production**:
1. Add MQTT authentication (username/password)
2. Validate firmware signature before flashing
3. Use HTTPS with certificate pinning
4. Implement firmware version checking
5. Rate limit OTA commands

## Current Status (2025-11-16)

### ✅ FULLY WORKING
- MQTT-triggered OTA command reception via `obedio/button/{DEVICE_ID}/ota`
- HTTP firmware download (fixed with `HTTP_TRANSPORT_OVER_TCP`)
- LED task suspension during OTA (prevents flash cache access crash)
- Firmware upload to NUC and NGINX serving at `http://10.10.0.10:3000/firmware.bin`
- OTA download completes successfully (~60 seconds for 975KB)
- Deployment automation script (`deploy_ota_firmware.sh`)
- **Firmware updates and persists correctly** - buildHash verification confirms successful deployment
- Enhanced heartbeat with diagnostic information (IP, SSID, partition, heap, etc.)

### ✅ FIXED - OTA Update Issues (2025-11-16)

**Previous Issue**: OTA updates were failing - new firmware wouldn't run after deployment

**Root Cause**: Enhanced heartbeat code with WiFi/OTA API calls (`esp_wifi_get_config()`, `esp_ota_get_running_partition()`) lacked proper error handling, causing the currently running broken firmware to fail when processing OTA updates.

**Solution Applied**:
1. **Temporary simplification**: Removed problematic API calls to deploy working firmware
2. **Safe error handling**: Re-added enhanced features with comprehensive error handling:
   - Added `memset()` before `wifi_config_t` structure
   - Added NULL checks and validation before using pointers
   - Added error logging for debugging
   - Fixed array bounds check (changed `label != NULL` to `label[0] != '\0'`)

**Code Fix** (mqtt_handler.c:796-824):
```c
// WiFi SSID - with safe error handling
wifi_config_t wifi_config;
memset(&wifi_config, 0, sizeof(wifi_config));
esp_err_t wifi_err = esp_wifi_get_config(WIFI_IF_STA, &wifi_config);
if (wifi_err == ESP_OK && wifi_config.sta.ssid[0] != '\0') {
    cJSON_AddStringToObject(root, "wifiSSID", (char*)wifi_config.sta.ssid);
} else if (wifi_err != ESP_OK) {
    ESP_LOGW(TAG, "Failed to get WiFi SSID: %s", esp_err_to_name(wifi_err));
}

// Running partition - with safe error handling
const esp_partition_t *running = esp_ota_get_running_partition();
if (running != NULL && running->label[0] != '\0') {
    cJSON_AddStringToObject(root, "runningPartition", running->label);
} else if (running == NULL) {
    ESP_LOGW(TAG, "Failed to get running partition info");
}
```

**Verification**:
- Build hash successfully updated: `12:14:44` → `12:39:07` → `12:41:51`
- All enhanced heartbeat fields working correctly
- Device running on `ota_1` partition
- IP address: `10.10.0.195`
- Free heap: 7,667,200 bytes

### 🔧 Fixes Applied
1. **HTTP transport fix** (ota_handler.c:251):
   ```c
   .transport_type = HTTP_TRANSPORT_OVER_TCP  // Enables plain HTTP
   ```

2. **Cache access crash fix** (mqtt_handler.c:46-50):
   ```c
   led_stop_rainbow_task();  // Stop LED task before OTA
   vTaskDelay(pdMS_TO_TICKS(100));  // Wait for task to stop
   ```

3. **LED task management** (led_controller.c:194-210):
   - Added `led_stop_rainbow_task()` function
   - Properly deletes task handle and clears LEDs

## Next Steps

- [x] Fix OTA update persistence issue (COMPLETED 2025-11-16)
- [x] Add firmware build hash verification (COMPLETED 2025-11-16)
- [x] Implement enhanced heartbeat diagnostics (COMPLETED 2025-11-16)
- [x] Add MQTT configuration system (COMPLETED 2025-11-16 - see [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md))
- [ ] Enable UDP wireless logging
- [ ] Implement OTA progress reporting via MQTT
- [ ] Add pre-OTA validation checks
- [ ] Add firmware signature verification

## Support

For issues or questions:
1. Check serial output: `python3 /Users/nicolas/vibecoding/obedio/check_device_long.py`
2. Monitor MQTT: `ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_sub -h localhost -t "obedio/button/#" -v'`
3. Verify NUC services: `ssh obedio@10.10.0.10 "docker ps"`

---

**Last Updated**: 2025-11-16
**Firmware Version**: v1.0 (with OTA support)
**Device ID**: BTN-6DB9AC
