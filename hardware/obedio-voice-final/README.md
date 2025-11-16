# OBEDIO ESP32-S3 Smart Button - Voice Recording Firmware

## 📌 Overview

This is the **final production firmware** for the OBEDIO ESP32-S3 Smart Button with voice recording capability.

### Features
- ✅ **Hold T1 → Record voice** (up to 10 seconds)
- ✅ **Release T1 → Upload to server** (WiFi)
- ✅ **Server transcribes** using Whisper AI
- ✅ **Playback recorded audio** on button's speaker
- ✅ **MQTT integration** for real-time notifications
- ✅ **LED animations** for visual feedback
- ✅ **5 physical buttons** (T1 main + T2-T5 auxiliary)

---

## 🛠️ Hardware Configuration

### ESP32-S3 Custom PCB v3.0

#### I2C Bus (SDA=GPIO3, SCL=GPIO2)
- **MCP23017** - 5 button I/O expander (address 0x20)
- **LIS3DH** - Accelerometer (not used in this firmware)

#### Buttons (via MCP23017 Port A)
| Button | Pin  | Function |
|--------|------|----------|
| T1     | GPA7 | Main button (voice recording) |
| T2     | GPA6 | Auxiliary button 1 (blue LED) |
| T3     | GPA5 | Auxiliary button 2 (green LED) |
| T4     | GPA4 | Auxiliary button 3 (yellow LED) |
| T5     | GPA3 | Auxiliary button 4 (magenta LED) |

#### LED Ring (WS2812B)
- **Pin:** GPIO17
- **Count:** 16 LEDs
- **Brightness:** 150/255

#### I2S Microphone (INMP441 or similar)
- **BCLK:** GPIO33
- **WS (LRCK):** GPIO38
- **SD (DOUT):** GPIO34
- **Sample Rate:** 16 kHz, 16-bit mono

#### I2S Speaker (MAX98357A)
- **BCLK:** GPIO10
- **WS (LRCK):** GPIO18
- **SD (DIN):** GPIO11
- **SD_MODE (Enable):** GPIO14

#### LoRa SX1262
- Not used in this firmware version

---

## 📱 Backend Integration

### WiFi Configuration
```cpp
const char* WIFI_SSID     = "Obedio";
const char* WIFI_PASSWORD = "BrankomeinBruder:)";
```

### Server Configuration
```cpp
const char* BACKEND_HOST = "10.10.0.207";
const uint16_t BACKEND_PORT = 8080;
const char* UPLOAD_ENDPOINT = "/api/upload/upload-audio";
```

### MQTT Configuration
```cpp
const char* MQTT_HOST = "10.10.0.207";
const uint16_t MQTT_PORT = 1883;
```

### MQTT Topics
- **Publish to:** `obedio/button/{deviceId}/press`
- **Subscribe to:** `obedio/device/{deviceId}/command`
- **Register on:** `obedio/device/register`

---

## 🎯 Usage Workflow

### Voice Recording (T1 - Main Button)

1. **Press and HOLD T1**
   - LED ring: **Blue spinning** animation
   - Microphone starts recording
   - Serial: `🎤 Recording audio...`

2. **Release T1** (after at least 0.5 seconds)
   - LED ring: **Yellow pulse** (uploading)
   - Audio uploaded to server as WAV file
   - Server transcribes using Whisper AI
   - Serial: `✅ Upload successful!`

3. **Server Response**
   - Returns: `audioUrl` and `transcript`
   - LED ring: **Green flash** (success)
   - MQTT message published with voice data

4. **Audio Playback**
   - LED ring: **Cyan solid** (playing)
   - Recorded audio plays on MAX98357A speaker
   - Serial: `🔊 Playing back recorded audio...`
   - LED ring: **Off** (finished)

### Quick Press (< 0.5 seconds)
   - LED ring: **White flash**
   - MQTT: Service call (no voice)
   - Serial: `📞 Short press - Service Call`

### Auxiliary Buttons (T2-T5)
- **T2:** Blue LED
- **T3:** Green LED
- **T4:** Yellow LED
- **T5:** Magenta LED

Each aux button publishes MQTT with button ID (aux1-aux4).

---

## 🎨 LED Animations

| State | Color | Pattern | Description |
|-------|-------|---------|-------------|
| Recording | Blue | Spinning | Voice recording in progress |
| Uploading | Yellow | Pulse | Sending to server |
| Success | Green | 3x Flash | Upload successful |
| Error | Red | 5x Flash | Upload failed or recording too short |
| Playback | Cyan | Solid | Audio playing on speaker |
| Idle | Off | - | Waiting for input |

---

## 📊 Technical Specifications

### Memory Usage
- **Audio Buffer:** 320 KB (10 seconds @ 16 kHz 16-bit)
- **ESP32-S3 SRAM:** 512 KB total
- **Heap after init:** ~180 KB free

### Audio Parameters
- **Sample Rate:** 16,000 Hz
- **Bit Depth:** 16-bit
- **Channels:** Mono (left only)
- **Format:** WAV PCM
- **Max Duration:** 10 seconds
- **File Size:** ~320 KB per recording

### Network
- **WiFi:** 2.4 GHz 802.11 b/g/n
- **MQTT:** QoS 0 (at most once)
- **HTTP:** Multipart form-data upload
- **Timeout:** 30 seconds for upload

---

## 🚀 Installation

### Arduino IDE Setup

1. **Install ESP32 Board Support**
   ```
   File → Preferences → Additional Board Manager URLs:
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```

2. **Install Board**
   ```
   Tools → Board → Boards Manager → Search "ESP32" → Install "esp32 by Espressif"
   ```

3. **Select Board**
   ```
   Tools → Board → ESP32 Arduino → ESP32S3 Dev Module
   ```

4. **Board Configuration**
   ```
   USB CDC On Boot: Enabled
   Flash Size: 16MB (128Mb)
   Partition Scheme: Default 4MB with spiffs
   PSRAM: QSPI PSRAM
   Upload Speed: 921600
   ```

### Required Libraries

Install via Arduino Library Manager:
- **Adafruit NeoPixel** (>= 1.10.0)
- **Adafruit MCP23017** (>= 2.0.0)
- **PubSubClient** (>= 2.8.0)
- **ArduinoJson** (>= 6.21.0)

### Upload Firmware

1. Connect ESP32-S3 via USB-C
2. Select correct COM port: `Tools → Port`
3. Click **Upload** button
4. Wait for "Done uploading" message
5. Open Serial Monitor at **115200 baud**

---

## 🐛 Troubleshooting

### No Audio Recording
- Check microphone connections (BCLK, WS, SD)
- Verify I2S pins match your hardware
- Check Serial Monitor for I2S errors

### Upload Fails
- Verify WiFi credentials
- Check backend server is running on port 8080
- Ensure `/api/upload/upload-audio` endpoint exists
- Check Serial Monitor for HTTP error codes

### MQTT Not Connecting
- Verify Mosquitto broker is running
- Check MQTT host/port configuration
- Ensure broker allows anonymous connections

### No Playback
- Check MAX98357A connections
- Verify SD_MODE pin is HIGH (GPIO14)
- Increase volume (if amplifier has gain control)

### LEDs Not Working
- Check GPIO17 connection
- Verify NUM_LEDS = 16
- Check power supply (5V, 1A minimum)

---

## 📝 Serial Monitor Output Example

```
========================================
OBEDIO ESP32-S3 Smart Button - Voice
========================================

✅ I2C initialized (SDA=3, SCL=2)
✅ MCP23017 initialized (5 buttons)
✅ LED Ring initialized (16 LEDs)
✅ I2S Speaker initialized
✅ I2S Microphone initialized (16kHz)
✅ Audio buffer allocated: 320000 bytes
📡 Connecting to WiFi: Obedio
....✅ WiFi connected! IP: 10.10.0.123
🆔 Device ID: BTN-30EDA0A3200C
📡 Connecting to MQTT broker... ✅ Connected!
📥 Subscribed to: obedio/device/BTN-30EDA0A3200C/command

✅ Firmware ready!
📌 Hold T1 to record voice message

🔘 T1 pressed
🎤 Long press detected - Recording started!
🎙️ Recording audio...
✅ Recorded 4.2 seconds (67200 samples)
🔘 T1 released (held 4300ms)
🎤 Recording stopped (67200 samples)
📤 Uploading to: http://10.10.0.207:8080/api/upload/upload-audio
✅ Upload OK (HTTP 200)
Response: {"success":true,"data":{"audioUrl":"http://10.10.0.207:8080/uploads/audio-1705420123456.wav","transcript":"Hello, I need assistance in cabin 5","language":"en"}}
🎵 Audio URL: http://10.10.0.207:8080/uploads/audio-1705420123456.wav
📝 Transcript: Hello, I need assistance in cabin 5
✅ Upload successful!
📤 MQTT Published: {"deviceId":"BTN-30EDA0A3200C","button":"main","pressType":"long","battery":100,"rssi":-42,"firmwareVersion":"v3.0-voice","timestamp":123456,"audioUrl":"http://10.10.0.207:8080/uploads/audio-1705420123456.wav","voiceTranscript":"Hello, I need assistance in cabin 5"}
🔊 Playing back recorded audio...
🔊 Playing 67200 samples...
✅ Playback finished
```

---

## 🔄 Firmware Updates

### Version History
- **v3.0-voice** (2025-01-16) - Initial voice recording release

### Future Enhancements
- [ ] LoRa backup communication
- [ ] Accelerometer shake detection
- [ ] OTA firmware updates
- [ ] Battery level monitoring
- [ ] Touch button support

---

## 📞 Support

- **GitHub Issues:** [Report bugs](https://github.com/obedio/firmware/issues)
- **Documentation:** [Full docs](https://docs.obedio.com)
- **Email:** support@obedio.com

---

**Made with ❤️ by the Obedio Team**
