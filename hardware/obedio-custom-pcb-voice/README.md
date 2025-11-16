# OBEDIO Custom PCB - Voice Recording Firmware

**Integrated firmware with voice recording support for ESP32-S3 Custom PCB**

## Overview

This firmware combines the base functionality from `obedio-custom-pcb-simple.ino` with voice recording capabilities from `AUDIO_RECORDING_UPDATE.ino`.

## Features

✅ **6 Physical Buttons (T1-T6)**
- T1 (main) - Voice recording (hold to record, release to upload)
- T2-T6 (aux) - Regular button presses with single, double, and long press detection

✅ **Voice Recording**
- 15-second maximum recording (reduced from 30s for battery safety)
- 8kHz 16-bit audio (240KB buffer)
- WAV file encoding
- HTTP upload to backend server
- Visual LED feedback during recording

✅ **16 NeoPixel LED Ring**
- Rainbow animation during idle
- Blue pulsing during voice recording
- Green during upload
- White flash on success
- Red flash on error

✅ **LIS3DHTR Accelerometer**
- Shake detection for emergency alerts
- Configurable sensitivity threshold

✅ **MQTT Communication**
- Device registration
- Button press events
- Voice message events with audio URL

## Hardware Connections

### I2S Microphone (INMP441 or similar)
- **WS** (Word Select/LRCK) → GPIO 38
- **SD** (Serial Data/DOUT) → GPIO 34
- **SCK** (Serial Clock/BCLK) → GPIO 33
- **VDD** → 3.3V
- **GND** → GND
- **L/R** → GND (for left channel)

### I2C Devices
- **SDA** → GPIO 3
- **SCL** → GPIO 2
- MCP23017 I/O Expander → Address 0x20
- LIS3DHTR Accelerometer → Address 0x19

### NeoPixel LED
- **LED_PIN** → GPIO 17

## Configuration

### Network Settings
```cpp
const char* ssid = "Obedio";
const char* password = "BrankomeinBruder:)";
const char* mqtt_server = "10.10.0.207";
const int mqtt_port = 1883;
```

### Backend Server
```cpp
const char* backend_server = "http://10.10.0.207:8080/api/upload/upload-audio";
```

### Audio Settings
```cpp
#define SAMPLE_RATE 8000           // 8kHz for voice
#define BITS_PER_SAMPLE 16         // 16-bit audio
#define MAX_RECORD_TIME_SEC 15     // 15 seconds max
```

## Usage

### Voice Recording Workflow

1. **Press and hold T1** (main button)
   - Blue LEDs pulse = recording in progress
   - Maximum 15 seconds of recording

2. **Release T1** to stop recording
   - Green LEDs = uploading to backend
   - Audio converted to WAV format

3. **Success**
   - White flash = upload successful
   - Audio URL sent via MQTT with `pressType: "voice"`
   - Memory cleared, ready for next recording

4. **Error**
   - Red flash = upload failed
   - Check serial monitor for error details

### Regular Button Presses (T2-T6)

- **Single Press**: White flash
- **Double Press**: Yellow flash (within 500ms)
- **Long Press**: Blue flash (hold > 700ms)

### Shake Detection

- Shake device to trigger emergency alert
- Red LEDs indicate shake detected
- Sends MQTT message with `pressType: "shake"`

## Memory Usage

- **Audio Buffer**: 240KB (15 seconds at 8kHz 16-bit)
- **Total RAM**: ~250KB used (fits in ESP32-S3's 512KB SRAM)
- Buffer is dynamically allocated and freed after each recording

## MQTT Message Format

### Voice Message
```json
{
  "deviceId": "BTN-XXXXXXXXXXXX",
  "button": "main",
  "pressType": "voice",
  "voiceAudioUrl": "http://10.10.0.207:8080/uploads/audio/recording-1234567890.wav",
  "battery": 100,
  "rssi": -45,
  "firmwareVersion": "v2.2-voice",
  "timestamp": 123456,
  "sequenceNumber": 42
}
```

### Regular Button Press
```json
{
  "deviceId": "BTN-XXXXXXXXXXXX",
  "button": "main|aux1|aux2|aux3|aux4|aux5",
  "pressType": "single|double|long|shake",
  "battery": 100,
  "rssi": -45,
  "firmwareVersion": "v2.2-voice",
  "timestamp": 123456,
  "sequenceNumber": 43
}
```

## Compilation

### Arduino IDE
1. Open `obedio-custom-pcb-voice.ino` in Arduino IDE
2. Select **ESP32-S3 Dev Module** as board
3. Configure board settings:
   - USB CDC On Boot: Enabled
   - PSRAM: OPI PSRAM (if available)
   - Partition Scheme: Default 4MB with spiffs
4. Install required libraries:
   - Adafruit MCP23017
   - Adafruit NeoPixel
   - LIS3DHTR
   - PubSubClient
   - ArduinoJson
5. Compile and upload

### Required Libraries
```
Adafruit MCP23017
Adafruit NeoPixel
LIS3DHTR (by Seeed Studio)
PubSubClient (by Nick O'Leary)
ArduinoJson (by Benoit Blanchon)
```

## Changes from Base Firmware

### Added Includes
- `#include <driver/i2s.h>` - I2S microphone support
- `#include <HTTPClient.h>` - HTTP upload support

### Added Configuration
- I2S pin definitions (GPIO 33, 34, 38)
- Audio recording settings (8kHz, 16-bit, 15s max)
- Backend server URL

### Added Functions
- `setupMicrophone()` - Initialize I2S microphone
- `recordAudio()` - Record audio while button held
- `createWAVHeader()` - Generate WAV file header
- `uploadAudioToBackend()` - Upload WAV to backend via HTTP

### Modified Functions
- `checkButtons()` - T1 now triggers voice recording instead of regular press
- `registerDevice()` - Added microphone capability

### Added Global Variables
- `audioBuffer` - 240KB audio buffer
- `recordedSamples` - Track recorded sample count
- `audioRecording` - Recording state flag

## Firmware Version

**v2.2-voice**

## Integration Notes

This firmware was created by merging:
- Base: `hardware/obedio-custom-pcb-simple/obedio-custom-pcb-simple.ino` (498 lines)
- Voice: `hardware/obedio-custom-pcb-simple/New folder/AUDIO_RECORDING_UPDATE/AUDIO_RECORDING_UPDATE.ino` (387 lines)

Key changes:
- Reduced recording time from 30s to 15s (safer for battery)
- Fixed backend URL to match actual API endpoint
- Integrated all audio functions into checkButtons() logic
- Maintained all original button functionality for T2-T6

## Troubleshooting

### Recording Not Working
- Check I2S microphone connections
- Verify GPIO pins match your hardware
- Monitor serial output for initialization errors

### Upload Fails
- Verify backend server is running
- Check network connectivity
- Ensure backend endpoint accepts multipart/form-data

### Memory Issues
- ESP32-S3 has 512KB SRAM
- 240KB audio buffer fits comfortably
- Buffer is freed after each upload

### Button Not Responding
- Check MCP23017 I2C connection
- Verify button wiring to MCP23017
- Monitor serial output for press events

## Serial Monitor Output

Expected output on successful voice recording:
```
Button T1 pressed down
🎤 Recording... (release button to stop)
✅ Recorded 45000 samples (5.6 seconds)
📤 Uploading audio to backend...
✅ Upload successful!
🎵 Audio URL: http://10.10.0.207:8080/uploads/audio/recording-1234567890.wav
✅ Voice message published with audio URL
```

## License

Part of the OBEDIO Smart Button System