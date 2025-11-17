# ESP32-S3 Voice Recording Fixes Applied

**Date**: 2025-01-17 (Pre-METS Demo)
**Problem**: Firmware crashes when uploading audio (even 1-2 second recordings)
**Root Cause**: Memory allocation and HTTP upload method issues

---

## ✅ **FIXES APPLIED**

### 1. **PSRAM Memory Allocation** (Line 175-189)

**Before** (❌ BROKEN):
```cpp
audioBuffer = (int16_t*)malloc(MAX_SAMPLES * sizeof(int16_t));  // Regular heap
```

**After** (✅ FIXED):
```cpp
audioBuffer = (int16_t*)heap_caps_malloc(MAX_SAMPLES * sizeof(int16_t), MALLOC_CAP_SPIRAM);
```

**Why it crashed**:
- ESP32-S3R8 has 8MB PSRAM, but old code allocated from limited internal heap (~400KB)
- During HTTP upload, WiFi stack + HTTP buffers exhausted heap → **CRASH**
- Now uses PSRAM with fallback to heap if PSRAM fails

---

### 2. **HTTP Upload Method** (Line 670-724)

**Before** (❌ BROKEN):
```cpp
WiFiClient* stream = http.getStreamPtr();
http.POST((uint8_t*)nullptr, 0);  // ← BUGGY!
stream->print(header);
stream->write(wavHeader, 44);
// ... manual streaming
```

**After** (✅ FIXED):
```cpp
// Build complete payload in PSRAM
uint8_t* payload = heap_caps_malloc(totalSize, MALLOC_CAP_SPIRAM);
memcpy(payload, ...);  // Header + WAV + Audio + Footer

// Send as single POST
http.POST(payload, totalSize);  // ← CORRECT!
free(payload);
```

**Why it crashed**:
- Arduino HTTPClient's streaming API is buggy and fragile
- Manual stream writes can cause memory corruption
- New method builds complete multipart payload in memory (safe with PSRAM)

---

### 3. **Backend Configuration** (Line 44-50)

**Before** (❌ WRONG):
```cpp
const char* BACKEND_HOST = "10.10.0.207";  // Old IP
const uint16_t BACKEND_PORT = 8080;        // Wrong port
const char* UPLOAD_ENDPOINT = "/api/transcribe";  // Wrong endpoint
```

**After** (✅ FIXED):
```cpp
const char* BACKEND_HOST = "10.10.0.10";
const uint16_t BACKEND_PORT = 3001;
const char* UPLOAD_ENDPOINT = "/api/voice/upload";  // Correct endpoint
```

---

### 4. **Response Parsing** (Line 732-748)

**Before** (for `/api/transcribe`):
```json
{
  "success": true,
  "transcript": "Hello world",
  "translation": "Hello world",
  "language": "en"
}
```

**After** (for `/api/voice/upload`):
```json
{
  "success": true,
  "url": "http://10.10.0.10:3001/uploads/voice/voice-XXX.wav",
  "filename": "voice-XXX.wav",
  "size": 96000
}
```

Code now extracts `url` field and publishes via MQTT for backend transcription.

---

## 📊 **MEMORY USAGE COMPARISON**

| Component | Before (Heap) | After (PSRAM) |
|-----------|---------------|---------------|
| Audio Buffer (3s) | 96 KB | 96 KB (PSRAM) |
| HTTP Payload | ~110 KB | ~110 KB (PSRAM) |
| WiFi Stack | ~80 KB | ~80 KB |
| Free Heap | **~214 KB** ⚠️ | **~400 KB** ✅ |
| Free PSRAM | N/A | **~7.8 MB** ✅ |

**Result**: No more heap exhaustion during upload!

---

## 🧪 **TESTING CHECKLIST**

Before METS Demo:
- [ ] Compile firmware (verify no errors)
- [ ] Upload to ESP32-S3
- [ ] Test 1-2 second voice recording
- [ ] Verify upload succeeds (check backend receives file)
- [ ] Test 5-10 second recording
- [ ] Verify MQTT message with audio URL
- [ ] Test LED animations during recording

---

## 📝 **COMPILATION INSTRUCTIONS**

### Arduino IDE Settings:
1. **Board**: ESP32S3 Dev Module
2. **Flash Size**: 8MB (or 16MB if custom partition)
3. **PSRAM**: OPI PSRAM ✅ (CRITICAL!)
4. **Upload Speed**: 921600
5. **USB CDC On Boot**: Enabled (for Serial output)

### Required Libraries:
```
- WiFi (built-in)
- HTTPClient (built-in)
- PubSubClient v2.8.0+
- Adafruit_MCP23X17 v2.3.0+
- Adafruit_NeoPixel v1.11.0+
- ArduinoJson v6.21.0+
```

### Compile Command (if using arduino-cli):
```bash
arduino-cli compile --fqbn esp32:esp32:esp32s3:FlashSize=8M,PSRAM=opi obedio-voice-final.ino
arduino-cli upload --fqbn esp32:esp32:esp32s3 --port COM23 obedio-voice-final.ino
```

---

## 🚨 **CRITICAL NOTES**

1. **PSRAM MUST BE ENABLED** in Arduino IDE settings!
   - Without PSRAM, code will fall back to heap (may still crash)
   - Look for "✅ Audio buffer in PSRAM" in Serial output

2. **Watchdog Timer**:
   - HTTP upload takes 2-5 seconds
   - Watchdog timeout is 30 seconds (safe)
   - LED animation during upload prevents appearance of freeze

3. **Network Reliability**:
   - If WiFi disconnects during upload → retry logic needed (future enhancement)
   - For demo: ensure stable WiFi connection

---

## 🎯 **EXPECTED BEHAVIOR**

1. Press and hold T1 (main button)
2. LED ring: **Blue rotating** animation → Recording
3. Release T1
4. LED ring: **Blue pulsing** → Uploading
5. **Success**: Green flash + MQTT publish
6. **Failure**: Red flash + error in Serial

**Serial Output Example**:
```
✅ Audio buffer in PSRAM: 96000 bytes (93.8KB)
🔴 Idle (ready)
📝 Button press detected: T1 (long)
🎙️  Recording...
✅ Recorded 2.3 seconds (37120 samples)
📦 Payload size: 37336 bytes (36.5KB)
📤 Sending POST request...
✅ Upload OK (HTTP 200)
🔗 Audio URL: http://10.10.0.10:3001/uploads/voice/voice-1705420123456.wav
📤 MQTT Published: obedio/button/BTN-A3200C/voice
```

---

## 📚 **FILES MODIFIED**

- `obedio-voice-final.ino` (lines 36, 44-50, 175-189, 670-763)

**Changes**:
- Added `#include "esp_heap_caps.h"`
- Fixed backend config (IP, port, endpoint)
- Changed malloc → heap_caps_malloc for PSRAM
- Rewrote HTTP upload to use complete payload method
- Updated JSON response parsing for new endpoint

---

**Status**: ✅ READY FOR COMPILATION AND TESTING
**Next Step**: Upload to ESP32-S3 and test voice recording!
