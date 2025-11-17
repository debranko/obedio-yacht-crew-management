# 🛠️ Watchdog Timer Bootloop Fix

**Problem**: ESP32-S3 stuck in bootloop with `TG1WDT_SYS_RST` error
**Root Cause**: I2S initialization taking too long, triggering watchdog timer reset
**Status**: ✅ FIXED

---

## ✅ **What Was Changed**

### 1. **Watchdog Timer Management**
- Disabled watchdog at start of `setup()`
- Re-enabled with 30-second timeout after setup completes
- Added watchdog reset in `loop()` to prevent timeouts

### 2. **Hardware Initialization Delays**
- Added 100ms delays between I2C, MCP23017, LED init
- Added 200ms delays after I2S Speaker and Microphone init
- Allows hardware to stabilize before next operation

### 3. **PSRAM Detection**
- Added PSRAM check at boot to verify it's enabled
- Shows total and free PSRAM in Serial output
- Warns if PSRAM is missing

### 4. **Detailed Debug Output**
- I2S microphone init now shows each step:
  - Creating config
  - Installing driver
  - Setting pins
  - Clearing DMA buffer
- Better error messages with hex error codes

---

## 📋 **Expected Serial Output**

### ✅ **Successful Boot**:
```
========================================
OBEDIO ESP32-S3 Smart Button - Voice
========================================

✅ PSRAM detected: 8388608 bytes (8.0MB)
   Free PSRAM: 8380416 bytes (8.0MB)

✅ I2C initialized (SDA=3, SCL=2)
✅ MCP23017 initialized (5 buttons)
✅ LED Ring initialized (16 LEDs)
✅ I2S Speaker initialized
⏳ Initializing I2S Microphone...
  → Creating I2S MIC config...
  → Installing I2S MIC driver...
  → Setting I2S MIC pins...
  → Clearing DMA buffer...
✅ I2S Microphone initialized (16kHz, BCK=33, WS=38, SD=34)
⏳ Allocating audio buffer...
✅ Audio buffer in PSRAM: 96000 bytes (93.8KB)
⏳ Connecting to WiFi...
📡 Connecting to WiFi: Obedio
.........
✅ WiFi connected! IP: 10.10.0.x
⏳ Connecting to MQTT...
✅ MQTT connected!

✅ Firmware ready!
📌 Hold T1 to record voice message
```

### ❌ **If Still Crashing**:
Check for these messages before crash:
- `⚠️ WARNING: PSRAM NOT DETECTED!` → Enable PSRAM in Arduino IDE
- `❌ I2S MIC install error: XX` → I2S driver conflict or wrong pins
- Crash after speaker init → Pin conflict between speaker and microphone

---

## 🔧 **Arduino IDE Settings** (CRITICAL!)

```
Tools → Board → ESP32 Arduino → ESP32S3 Dev Module
Tools → Flash Size → 8MB (or 16MB)
Tools → PSRAM → OPI PSRAM ← ⚠️ MUST BE ENABLED!
Tools → Partition Scheme → Default 4MB with spiffs
Tools → Upload Speed → 921600
Tools → USB CDC On Boot → Enabled
Tools → Core Debug Level → None (or Info for debugging)
```

---

## 🐛 **Troubleshooting**

### Issue: Still getting watchdog reset
**Solution**: Increase watchdog timeout in code (line 232-236):
```cpp
.timeout_ms = 60000,  // Change to 60 seconds
```

### Issue: I2S Microphone install error
**Check**:
- GPIO pins not conflicting with flash/SPI
- I2S_NUM_0 not used by another peripheral
- DMA buffers not too large (reduce `BLOCK_SAMPLES` if needed)

### Issue: No PSRAM detected
**Fix**:
1. Arduino IDE: Tools → PSRAM → **OPI PSRAM**
2. Re-compile and upload
3. Check Serial Monitor for "✅ PSRAM detected"

### Issue: WiFi takes too long to connect
**Fix**: WiFi connection has 20-attempt limit (10 seconds)
- If WiFi unreachable, device will continue without WiFi
- Check SSID and password in code (lines 40-41)

---

## 📊 **Code Changes Summary**

| File | Lines | Change |
|------|-------|--------|
| `obedio-voice-final.ino` | 37 | Added `esp_task_wdt.h` include |
| | 165-166 | Disable watchdog at start of setup() |
| | 173-182 | PSRAM detection and warning |
| | 186-202 | Added delays between hardware init |
| | 231-238 | Re-enable watchdog with 30s timeout |
| | 267 | Reset watchdog in loop() |
| | 383-427 | Detailed I2S MIC debug output |

---

## ✅ **Next Steps**

1. **Upload firmware** to ESP32-S3
2. **Open Serial Monitor** (115200 baud)
3. **Watch for successful boot** (no reset loop)
4. **Test voice recording**:
   - Press and hold T1 button
   - Speak into microphone
   - Release T1
   - Check for upload success

---

**Status**: Ready for testing!
**Last Updated**: 2025-01-17 (Pre-METS Demo)
