# OBEDIO ESP32-S3 Button - Current Working Status

**Firmware Version**: v3.0-esp-idf
**Last Updated**: November 16, 2025
**Device ID**: BTN-6DB9AC (MAC: 3C:DC:75:6D:B9:AC)

## ✅ WORKING FEATURES

### Core Functionality
- ✅ **Device boots successfully**
- ✅ **WiFi connects** to network (SSID: "Obedio")
- ✅ **MQTT connects** to broker (mqtt://10.10.0.10:1883)
- ✅ **Button detection** - all 6 buttons (T1-T6) working
- ✅ **LED animations** - white running light (single LED moving in circle)
- ✅ **Heartbeat** - device sends MQTT heartbeat every 30 seconds

### Button Functionality
| Button | Action | MQTT Message | LED Feedback |
|--------|--------|--------------|--------------|
| **T1 (main)** | Short press (<0.5s) | `main/single` | White flash |
| **T1 (main)** | Long press (≥0.5s) | `main/voice` | Blue flash |
| **T2-T6** | Single press | `T2/single` - `T6/single` | White flash |
| **T2-T6** | Double-click | `T2/double` - `T6/double` | Yellow flash |
| **T2-T6** | Long press | `T2/long` - `T6/long` | Cyan flash |

### MQTT Messages Sent
1. **Device Registration** (on boot):
   ```json
   Topic: obedio/button/BTN-6DB9AC/register
   Payload: {
     "deviceId": "BTN-6DB9AC",
     "firmwareVersion": "v3.0-esp-idf",
     "ipAddress": "10.10.0.195"
   }
   ```

2. **Button Press**:
   ```json
   Topic: obedio/button/BTN-6DB9AC/press
   Payload: {
     "deviceId": "BTN-6DB9AC",
     "button": "main",
     "pressType": "single",
     "battery": 100,
     "rssi": -42,
     "timestamp": 1234567890
   }
   ```

3. **Heartbeat** (every 30s):
   ```json
   Topic: obedio/button/BTN-6DB9AC/heartbeat
   Payload: {
     "deviceId": "BTN-6DB9AC",
     "uptime": 300,
     "rssi": -42
   }
   ```

## ❌ DISABLED FEATURES (Intentionally)

### Temporarily Disabled Due to Technical Issues
1. **❌ Audio Recording** - Causes watchdog timeout crash
   - Code exists in `audio_recorder.c/h` but is not called
   - Button logic differentiates short/long press but doesn't record
   - Long press sends "voice" event for future implementation

2. **❌ Web Server** - Causes heap corruption crash
   - Code exists in `web_server.c/h` but is commented out in `main.c`
   - Will need memory optimization to re-enable
   - Not critical - all config can be done via MQTT from frontend

3. **❌ OTA Updates** - Depends on web server
   - Code exists in `ota_handler.c/h` but is commented out
   - Can be flashed manually via USB for now
   - Future: implement MQTT-based OTA

## 📊 Current Device State

### Network
- **WiFi Status**: Connected
- **SSID**: Obedio
- **IP Address**: 10.10.0.195
- **Signal Strength**: -42 dBm (Excellent)
- **mDNS**: `obedio-6db9ac.local`

### Memory Usage
- **Free Heap**: ~250 KB (out of 512 KB)
- **PSRAM**: ~1.8 MB free (out of 8 MB)
- **Flash Usage**: 950 KB (40% of partition)

### Hardware Status
- **MCP23017** (Button expander): ✅ Working @ 0x20
- **LIS3DHTR** (Accelerometer): ✅ Working @ 0x19 (shake detection disabled)
- **WS2812B LEDs**: ✅ Working (16 LEDs on GPIO17)
- **Touch Sensor**: ✅ Working (GPIO1)

## 🔧 Known Issues

### 1. Audio Recording Crash
**Symptom**: Device resets when attempting to record audio
**Cause**: Watchdog timeout during I2S recording task
**Workaround**: Audio recording disabled, button sends "voice" event instead
**Fix Needed**: Investigate I2S task priority and buffer management

### 2. Web Server Heap Corruption
**Symptom**: `CORRUPT HEAP` error on web server start
**Cause**: HTTP server stack size too large or memory alignment issue
**Workaround**: Web server disabled
**Fix Needed**: Reduce HTTP server stack size, use static allocation

###  3. MQTT Initially Caused Crash (FIXED)
**Previous Issue**: Watchdog timeout on MQTT init
**Fix Applied**: Initialization order corrected
**Status**: ✅ Now working

## 🚀 Quick Start

### Flash Firmware (Mac/Linux)
```bash
cd hardware/obedio-esp-idf
source ~/esp/esp-idf/export.sh
idf.py -p /dev/cu.usbmodem1101 flash monitor
```

### Flash Firmware (Windows)
See `WINDOWS_SETUP.md` for detailed Windows instructions

### Monitor Serial Output
```bash
python3 read_serial.py
```

### Test Button Presses
1. Flash firmware
2. Wait for device to boot (~5 seconds)
3. Look for white running light
4. Press any button - should see LED flash
5. Check MQTT broker for messages:
   ```bash
   mosquitto_sub -h 10.10.0.10 -t 'obedio/button/#' -v
   ```

## 📝 Development Notes

### What Was Changed Today
1. ✅ Disabled audio recording to prevent crashes
2. ✅ Fixed button logic to distinguish short vs long press
3. ✅ Re-enabled MQTT after fixing initialization
4. ✅ Disabled web server and OTA (causing crashes)
5. ✅ Verified all 6 buttons work correctly
6. ✅ Confirmed MQTT messages are being published

### Button Press Flow
```
Button Pressed (PRESS event)
   ↓
Start timer
   ↓
Button Released (SINGLE event)
   ↓
Check duration:
   • < 500ms → Send "single" event (white flash)
   • ≥ 500ms → Send "voice" event (blue flash)
```

### File Structure
```
obedio-esp-idf/
├── main/
│   ├── main.c              # ✅ Main app - button logic here
│   ├── button_handler.c    # ✅ Button detection
│   ├── mqtt_handler.c      # ✅ MQTT client
│   ├── led_controller.c    # ✅ LED animations
│   ├── wifi_manager.c      # ✅ WiFi connection
│   ├── audio_recorder.c    # ❌ DISABLED (crashes)
│   ├── web_server.c        # ❌ DISABLED (crashes)
│   └── ota_handler.c       # ❌ DISABLED (no web server)
├── components/
│   ├── mcp23017/           # ✅ Button GPIO expander
│   ├── lis3dhtr/           # ✅ Accelerometer
│   ├── led_effects/        # ✅ LED animations
│   └── adpcm_codec/        # ❌ Not used (audio disabled)
└── web/                    # ❌ Not used (web disabled)
```

## 🎯 Next Steps

### Short Term (Critical)
1. ✅ Document current working state
2. ⏳ Set up Git repository
3. ⏳ Create Windows setup guide
4. ⏳ Push to GitHub

### Medium Term (Nice to Have)
1. Fix audio recording crash (investigate I2S task)
2. Fix web server heap corruption (reduce memory usage)
3. Re-enable OTA updates
4. Add accelerometer shake detection back

### Long Term (Future Features)
1. Implement MQTT-based configuration
2. Add battery monitoring
3. Implement actual audio recording and transmission
4. Deep sleep power management

## 📞 Support

### Debugging
```bash
# Monitor serial output
idf.py -p /dev/cu.usbmodem1101 monitor

# Check MQTT messages
mosquitto_sub -h 10.10.0.10 -t 'obedio/#' -v

# Check device IP
ping obedio-6db9ac.local
```

### Common Issues
**Q: Device keeps rebooting**
A: Check serial monitor - if you see "audio recording started", the firmware is wrong version

**Q: No white light**
A: Device might not have finished booting - wait 10 seconds

**Q: Button presses not in frontend**
A: Check MQTT broker - messages ARE being sent (confirmed working)

**Q: Can't flash firmware**
A: Press and hold BOOT button, press RESET, release both

---

**Device Status**: ✅ FULLY FUNCTIONAL for button press detection and MQTT reporting
**Audio/Web/OTA**: ❌ Disabled but can be re-enabled once fixed
**Recommended for Production**: ✅ YES (for button functionality only)
