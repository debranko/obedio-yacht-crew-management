# MQTT Configuration System Guide

## Overview

The OBEDIO button device supports runtime configuration changes via MQTT. This allows you to modify device settings wirelessly without reflashing firmware or rebooting the device.

## Features

- Runtime configuration updates via MQTT
- Persistent storage in NVS (Non-Volatile Storage)
- Immediate effect for most settings (no reboot required)
- Configuration status reporting
- Visual feedback via LED flash on successful changes

## Supported Configuration Settings

| Setting | Type | Range | Default | Description |
|---------|------|-------|---------|-------------|
| `heartbeatInterval` | number | 5-300 | 30 | MQTT heartbeat interval in seconds |
| `sleepTimeout` | number | 10-300 | 30 | Auto-sleep timeout in seconds |
| `ledBrightness` | number | 0-255 | 128 | LED brightness level (0=off, 255=max) |
| `t3Topic` | string | max 128 chars | "tasmota_obedio/cmnd/POWER" | MQTT topic for T3 button |
| `t3Payload` | string | max 64 chars | "TOGGLE" | MQTT payload sent when T3 pressed |

## MQTT Topics

### Subscribe to Configuration Changes
**Topic**: `obedio/button/{DEVICE_ID}/config/set`

The device subscribes to this topic to receive configuration updates.

### Configuration Status
**Topic**: `obedio/button/{DEVICE_ID}/config/status`

The device publishes current configuration to this topic:
- On initial MQTT connection
- After processing a config update
- On request (future feature)

## Usage Examples

Replace `BTN-6DB9AC` with your actual device ID throughout these examples.

### Change Heartbeat Interval

Set heartbeat to every 60 seconds:

```bash
ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_pub -h localhost \
  -t "obedio/button/BTN-6DB9AC/config/set" \
  -m "{\"heartbeatInterval\": 60}"'
```

### Adjust LED Brightness

Set LED brightness to 1% (very dim):

```bash
ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_pub -h localhost \
  -t "obedio/button/BTN-6DB9AC/config/set" \
  -m "{\"ledBrightness\": 3}"'
```

Brightness values:
- `0` = LEDs off
- `3` = 1% (very dim)
- `25` = 10% (dim)
- `128` = 50% (default)
- `255` = 100% (maximum brightness)

### Configure T3 Button for Tasmota Control

Set T3 button to toggle a specific Tasmota device:

```bash
ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_pub -h localhost \
  -t "obedio/button/BTN-6DB9AC/config/set" \
  -m "{\"t3Topic\": \"tasmota_bedroom/cmnd/POWER\", \"t3Payload\": \"TOGGLE\"}"'
```

Now when T3 is pressed, the device will publish `TOGGLE` to `tasmota_bedroom/cmnd/POWER`.

### Update Multiple Settings at Once

```bash
ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_pub -h localhost \
  -t "obedio/button/BTN-6DB9AC/config/set" \
  -m "{\"heartbeatInterval\": 45, \"ledBrightness\": 64, \"sleepTimeout\": 60}"'
```

### Monitor Configuration Status

Listen for configuration status messages:

```bash
ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_sub -h localhost \
  -t "obedio/button/BTN-6DB9AC/config/status" -v'
```

Example output:
```json
{
  "heartbeatInterval": 30,
  "sleepTimeout": 30,
  "t3Topic": "tasmota_obedio/cmnd/POWER",
  "t3Payload": "TOGGLE",
  "ledBrightness": 128,
  "shakeThreshold": 1.5,
  "touchThreshold": 90
}
```

## Visual Feedback

When a configuration change is successfully applied:
- Device saves settings to NVS flash
- LEDs flash **GREEN** once (200ms)
- Configuration status is published to MQTT
- Changes take effect immediately (no reboot required)

## Dynamic Updates Without Reboot

### Immediate Effect Settings
These settings take effect immediately:
- `ledBrightness` - Next LED animation uses new brightness
- `heartbeatInterval` - Timer is updated in real-time using `xTimerChangePeriod()`
- `t3Topic` / `t3Payload` - Next T3 press uses new values

### Reboot Required Settings
These settings require a reboot to take effect:
- `sleepTimeout` - Currently not dynamically applied (future enhancement)

## Configuration Persistence

All configuration changes are saved to NVS (Non-Volatile Storage) flash memory:
- Settings survive power cycles
- Settings survive firmware updates (OTA)
- Settings can only be reset via Factory Reset

### NVS Keys

Internal NVS storage keys (for reference):

| Setting | NVS Key | Type |
|---------|---------|------|
| Heartbeat Interval | `hb_interval` | uint32 |
| Sleep Timeout | `sleep_timeout` | uint32 |
| T3 Topic | `t3_topic` | string |
| T3 Payload | `t3_payload` | string |
| LED Brightness | `led_brightness` | uint8 |
| Shake Threshold | `shake_threshold` | float |
| Touch Threshold | `touch_threshold` | uint8 |

## Enhanced Heartbeat Diagnostics

The heartbeat message now includes comprehensive diagnostic information:

### Basic Fields
- `deviceId`: Device identifier (e.g., "BTN-6DB9AC")
- `timestamp`: Milliseconds since boot
- `uptime`: System uptime in milliseconds
- `rssi`: WiFi signal strength in dBm
- `battery`: Battery percentage (0-100)
- `firmwareVersion`: Firmware version string (e.g., "v3.0-esp-idf")
- `buildHash`: Build timestamp for OTA verification (e.g., "BUILD-Nov 16 2025-12:41:51")

### Enhanced Diagnostic Fields (New)
- `ipAddress`: Device IP address (e.g., "10.10.0.195")
- `mqttConnected`: MQTT connection status (true/false)
- `wifiSSID`: Connected WiFi network name
- `freeHeap`: Available heap memory in bytes
- `runningPartition`: Active firmware partition ("ota_0" or "ota_1")

### Example Heartbeat Message

```json
{
  "deviceId": "BTN-6DB9AC",
  "timestamp": 4122299,
  "uptime": 33521,
  "rssi": -41,
  "battery": 100,
  "firmwareVersion": "v3.0-esp-idf",
  "buildHash": "BUILD-Nov 16 2025-12:41:51",
  "ipAddress": "10.10.0.195",
  "mqttConnected": true,
  "wifiSSID": "Obedio",
  "freeHeap": 7667200,
  "runningPartition": "ota_1"
}
```

**Topic**: `obedio/device/heartbeat`

## Troubleshooting

### Configuration Changes Not Applied

1. **Check MQTT connectivity**:
   ```bash
   ssh obedio@10.10.0.10 'docker exec obedio-mqtt mosquitto_sub -h localhost \
     -t "obedio/button/BTN-6DB9AC/#" -C 5 -v'
   ```
   You should see button presses and heartbeat messages.

2. **Verify topic name**: Ensure you're using the correct device ID in the topic.

3. **Check JSON syntax**: Invalid JSON will be silently ignored.

4. **Monitor device logs** (if serial connected):
   ```bash
   python3 /Users/nicolas/vibecoding/obedio/check_device_long.py
   ```

### No Green LED Flash After Config Change

Possible causes:
- Invalid JSON format
- Value out of range (e.g., `heartbeatInterval: 1000` exceeds max of 300)
- MQTT message not received by device
- Device not subscribed to config/set topic

### Heartbeat Interval Not Changing

1. Check value is within valid range (5-300 seconds)
2. Wait for next heartbeat cycle to observe new interval
3. Monitor MQTT: `mosquitto_sub -h localhost -t "obedio/device/heartbeat" -v`

### T3 Button Not Controlling Tasmota

1. **Verify Tasmota topic**:
   ```bash
   mosquitto_sub -h localhost -t "tasmota_obedio/#" -v
   ```

2. **Test Tasmota directly**:
   ```bash
   mosquitto_pub -h localhost -t "tasmota_obedio/cmnd/POWER" -m "TOGGLE"
   ```

3. **Check T3 configuration**: Subscribe to config/status to see current T3 settings

## Implementation Details

### Code Architecture

The configuration system is implemented across several files:

**main/config.h** (lines 259-344):
- NVS key definitions
- `device_config_t` structure with all configurable settings

**main/mqtt_handler.c** (lines 37-439):
- Runtime configuration structure
- `config_load_from_nvs()` - Load settings on boot
- `config_save_to_nvs()` - Persist settings to flash
- `config_update_heartbeat_timer()` - Dynamic timer updates
- `mqtt_publish_config_status()` - Publish current config
- MQTT message handler for `/config/set` topic

**main/mqtt_handler.c** (lines 787-824):
- Enhanced heartbeat with diagnostic fields
- Safe error handling for WiFi/OTA API calls

### Error Handling

All WiFi and OTA API calls include comprehensive error handling:

```c
// WiFi SSID retrieval with error handling
wifi_config_t wifi_config;
memset(&wifi_config, 0, sizeof(wifi_config));
esp_err_t wifi_err = esp_wifi_get_config(WIFI_IF_STA, &wifi_config);
if (wifi_err == ESP_OK && wifi_config.sta.ssid[0] != '\0') {
    cJSON_AddStringToObject(root, "wifiSSID", (char*)wifi_config.sta.ssid);
} else if (wifi_err != ESP_OK) {
    ESP_LOGW(TAG, "Failed to get WiFi SSID: %s", esp_err_to_name(wifi_err));
}
```

This prevents crashes when WiFi is disconnected or OTA partition information is unavailable.

## Security Considerations

The current implementation has no authentication on the config/set topic.

**Improvements for Production**:
1. Add MQTT authentication (username/password)
2. Implement access control lists (ACLs) per device
3. Validate configuration values server-side before publishing
4. Log all configuration changes for audit trail
5. Rate limit configuration updates

## Version History

- **v3.0 (2025-11-16)**: Initial MQTT configuration system
  - Runtime configuration via MQTT
  - Enhanced heartbeat diagnostics
  - NVS persistence
  - Dynamic heartbeat timer updates

## Support

For issues or questions:
1. Monitor device heartbeat: `mosquitto_sub -h localhost -t "obedio/device/heartbeat" -v`
2. Check configuration status: `mosquitto_sub -h localhost -t "obedio/button/{DEVICE_ID}/config/status" -v`
3. Review device logs via serial connection

---

**Last Updated**: 2025-11-16
**Firmware Version**: v3.0-esp-idf (with MQTT configuration)
**Device ID**: BTN-6DB9AC
