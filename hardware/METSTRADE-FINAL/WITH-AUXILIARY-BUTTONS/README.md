# OBEDIO ESP32-S3 Smart Button - WITH AUXILIARY BUTTONS

Complete implementation with all button functions matching the virtual button simulator.

## Features

✅ **Main Button (GPA7)** - Multi-function primary control
- Short press → Service call
- Long press (700ms) → Voice recording with transcription

✅ **Auxiliary Button 1 (GPA6)** - DND Toggle
- Single press → Do Not Disturb toggle

✅ **Auxiliary Button 2 (GPA5)** - Lights Control
- Single press → Control room lights (Crestron integration)

✅ **Auxiliary Button 3 (GPA4)** - Prepare Food
- Single press → Food preparation service request

✅ **Shake Detection** - Emergency alert
- Vigorous shake → Emergency call (highest priority)

✅ **LED Ring Feedback** - Visual status indication
- 16x WS2812B programmable LEDs

✅ **WiFi + MQTT** - Real-time backend communication

## Hardware Requirements

From **ESP32S3_Smart_Button_v3.0.pdf** schematic:

- **ESP32-S3** module with 8MB PSRAM
- **MCP23017** GPIO expander (I2C address 0x20)
- **LIS3DH** accelerometer (I2C address 0x19)
- **16x WS2812B** LED ring
- **MSM261S4030H0R** I2S microphone

### GPIO Pin Mapping

| Component | GPIO | Description |
|-----------|------|-------------|
| I2C SDA | GPIO3 | I2C data line |
| I2C SCL | GPIO2 | I2C clock line |
| LED Ring | GPIO17 | WS2812B data pin |
| Mic WS | GPIO38 | I2S LRCLK/WS |
| Mic SD | GPIO34 | I2S DOUT/SD |
| Mic SCK | GPIO33 | I2S BCLK/SCK |

### Button Mapping (on MCP23017)

| Button | Pin | Function | MQTT Button ID |
|--------|-----|----------|----------------|
| Main | GPA7 | Service call / Voice | `main` |
| Aux 1 | GPA6 | DND Toggle | `aux1` |
| Aux 2 | GPA5 | Lights Control | `aux2` |
| Aux 3 | GPA4 | Prepare Food | `aux3` |

## LED Feedback Colors

| Color | Meaning | RGB Value |
|-------|---------|-----------|
| 🔵 Blue | Connecting to WiFi | (0, 0, 255) |
| 🟣 Purple | Connecting to MQTT | (128, 0, 128) |
| 🟢 Green Pulse | Ready / Success | (0, 255, 0) |
| 🟡 Yellow | Main button pressed | (255, 255, 0) |
| 🔴 Red | Recording audio | (255, 0, 0) |
| 🟠 Orange | DND toggle (Aux1) | (255, 165, 0) |
| ⚪ White | Lights control (Aux2) | (255, 255, 255) |
| 🟢 Green-Cyan | Prepare food (Aux3) | (0, 255, 100) |
| 🔴 Rapid Flash | Emergency shake detected | Flashing red |

## MQTT Communication

### Published Topics

**Button Press Events:**
```
Topic: obedio/button/{deviceId}/press
Payload: {
  "deviceId": "BTN-AABBCCDDEEFF",
  "button": "main" | "aux1" | "aux2" | "aux3",
  "pressType": "single" | "long" | "shake",
  "timestamp": 12345,
  "battery": 100,
  "rssi": -45,
  "firmwareVersion": "v1.0-aux-buttons",
  "sequenceNumber": 0
}
```

**With Voice Recording:**
```json
{
  "deviceId": "BTN-AABBCCDDEEFF",
  "button": "main",
  "pressType": "long",
  "audioUrl": "http://10.10.0.207:8080/uploads/audio/recording-123.wav",
  "voiceTranscript": "I need more towels please",
  "timestamp": 12345,
  "battery": 100,
  "rssi": -45
}
```

**Shake Event (Emergency):**
```json
{
  "deviceId": "BTN-AABBCCDDEEFF",
  "button": "main",
  "pressType": "shake",
  "timestamp": 12345,
  "battery": 100,
  "rssi": -45
}
```

**Heartbeat:**
```
Topic: obedio/device/heartbeat
Frequency: Every 30 seconds
```

### Subscribed Topics

```
Topic: obedio/device/{deviceId}/command
Purpose: Receive commands from backend
```

## Backend Integration

The backend MQTT service ([`backend/src/services/mqtt.service.ts`](../../../backend/src/services/mqtt.service.ts)) automatically:

1. **Receives button press** via MQTT
2. **Derives priority** based on button/pressType:
   - `shake` → **Emergency** priority
   - `long` → **Voice** request type
   - `main` + `single` → **Normal** call
   - `aux1` → **DND toggle** (special handling)
   - `aux2` → **Lights** (Crestron control)
   - `aux3` → **Prepare food** service request
3. **Creates service request** in database
4. **Notifies crew** via WebSocket
5. **Updates dashboard** in real-time

## Button Functions Explained

### Main Button (GPA7)
- **Short Press (<700ms)**: Creates a simple service call request
- **Long Press (≥700ms)**: 
  1. Starts recording (red LED)
  2. Records up to 10 seconds of audio at 16kHz
  3. Uploads to backend server
  4. Backend transcribes with OpenAI Whisper
  5. Creates service request with transcript

### Aux1 Button (GPA6) - DND Toggle
- Toggles Do Not Disturb status for the location
- Backend MQTT handler manages DND state
- Orange LED flash confirms action

### Aux2 Button (GPA5) - Lights
- Controls room lighting via Crestron integration
- Direct action, no service request created
- White LED flash confirms action

### Aux3 Button (GPA4) - Prepare Food
- Creates a food preparation service request
- Assigned to on-duty crew
- Green-cyan LED flash confirms action

### Shake Detection
- **Emergency alert** - highest priority
- Requires vigorous shaking (magnitude >50,000)
- 2-second cooldown between detections
- Red rapid flash (5 times)
- Creates emergency service request

## Arduino IDE Configuration

**ESP32-S3 Settings:**
```
Board: "ESP32S3 Dev Module"
USB CDC On Boot: "Enabled"
CPU Frequency: "240MHz (WiFi)"
Flash Mode: "QIO 80MHz"
Flash Size: "16MB (128MB)"
Partition Scheme: "Huge APP (3MB No OTA/1MB SPIFFS)"
PSRAM: "OPI PSRAM"
Upload Speed: "921600"
```

## Required Libraries

Install via Arduino Library Manager:

1. **WiFi** (built-in)
2. **PubSubClient** by Nick O'Leary
3. **Adafruit NeoPixel**
4. **ArduinoJson** by Benoit Blanchon
5. **Adafruit MCP23X17**
6. **Adafruit LIS3DH**
7. **Adafruit Sensor**
8. **HTTPClient** (built-in)
9. **driver/i2s.h** (built-in)

## Installation & Configuration

1. **Install Libraries** (see above)

2. **Update Configuration** (lines 39-50):
   ```cpp
   const char* WIFI_SSID = "YourWiFiNetwork";
   const char* WIFI_PASSWORD = "YourPassword";
   const char* MQTT_BROKER = "10.10.0.207";  // Your MQTT broker IP
   const char* BACKEND_HOST = "10.10.0.207";  // Your backend server IP
   ```

3. **Upload Firmware**:
   - Connect ESP32-S3 via USB
   - Select correct board and port
   - Click Upload
   - Open Serial Monitor (115200 baud)

4. **Verify Operation**:
   - Check WiFi connection (Blue LED → Green pulse)
   - Check MQTT connection (Purple LED → Green pulse)
   - Test main button (Short press)
   - Test auxiliary buttons
   - Test shake detection (if accelerometer installed)

## Testing

### Serial Monitor Output

On successful startup, you should see:
```
═══════════════════════════════════════════════════════
  OBEDIO ESP32-S3 WITH AUXILIARY BUTTONS
  Firmware: v1.0-aux-buttons
═══════════════════════════════════════════════════════

Device ID: BTN-AABBCCDDEEFF

Initializing I2C bus...
Initializing MCP23017... ✓
✓ All buttons configured (Main + 3 Aux)
Initializing LED ring... ✓
Connecting to WiFi: YourNetwork
✓ WiFi connected!
IP: 192.168.1.100
RSSI: -45 dBm

Configuring MQTT: 10.10.0.207
Connecting to MQTT... ✓ Connected!

🔄 Scanning I2C for LIS3DH accelerometer... Found at 0x19
  Initializing LIS3DH... ✓ SUCCESS!
  Shake Detection: ENABLED
  Threshold: 5.0g

⚠ I2S microphone: Lazy init (will initialize on first recording)

✓ Setup complete - Ready!
```

### Button Test Sequence

1. **Main Button Short Press**:
   ```
   🔘 Main button pressed
   📞 SERVICE REQUEST
   ✓ Published: main / single
   ```

2. **Main Button Long Press**:
   ```
   🔘 Main button pressed
   🎙️ VOICE RECORDING STARTED
   🎙️ Recording audio...
   📤 Uploading to: http://10.10.0.207:8080/api/upload/upload-audio
   ✅ Upload successful!
   ✓ Published: main / long
   ```

3. **Aux1 Button (DND)**:
   ```
   🔕 AUX1 pressed - DND Toggle
   ✓ Published: aux1 / single
   ```

4. **Aux2 Button (Lights)**:
   ```
   💡 AUX2 pressed - Lights Control
   ✓ Published: aux2 / single
   ```

5. **Aux3 Button (Food)**:
   ```
   🍽️ AUX3 pressed - Prepare Food
   ✓ Published: aux3 / single
   ```

6. **Shake Detection**:
   ```
   🚨 SHAKE DETECTED!
     Magnitude: 65432 (threshold: 50000)
   ✓ Published SHAKE event (EMERGENCY)
   ```

## Troubleshooting

### No WiFi Connection
- Verify SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check serial output for errors

### No MQTT Connection
- Verify MQTT broker is running: `docker ps | grep mosquitto`
- Test broker: `mosquitto_sub -h 10.10.0.207 -t '#' -v`
- Check broker IP address

### Buttons Not Responding
- Verify MCP23017 initialization in serial monitor
- Check I2C wiring (SDA=GPIO3, SCL=GPIO2)
- Test I2C: Use I2C scanner sketch

### Accelerometer Not Working
- Check serial monitor for "Shake Detection: ENABLED"
- Verify LIS3DH address (0x19 or 0x18)
- If missing, device will work without shake detection

### Audio Upload Fails
- Verify backend is running: `curl http://10.10.0.207:8080/health`
- Check OpenAI API key in backend `.env`
- Check I2S microphone connections

### LED Ring Not Working
- Verify GPIO17 connection
- Check LED ring power supply (5V)
- Test with simple NeoPixel example

## Comparison: Virtual Simulator vs Hardware

This firmware exactly replicates the virtual button simulator:

| Feature | Virtual Simulator | Hardware Implementation |
|---------|------------------|------------------------|
| Main Button | ✅ Short/Long press | ✅ Short/Long press |
| Voice Recording | ✅ Browser microphone | ✅ I2S microphone |
| Aux1 (DND) | ✅ Click handler | ✅ GPA6 button |
| Aux2 (Lights) | ✅ Click handler | ✅ GPA5 button |
| Aux3 (Food) | ✅ Click handler | ✅ GPA4 button |
| Shake Detection | ✅ Button click | ✅ LIS3DH accelerometer |
| LED Feedback | ✅ Visual animation | ✅ 16x WS2812B LEDs |
| MQTT Messages | ✅ Exact format | ✅ Exact format |

## Next Steps

Once this firmware is working, you can add:

- [ ] Battery monitoring (if using battery power)
- [ ] Deep sleep mode for power saving
- [ ] OTA firmware updates
- [ ] Additional auxiliary buttons (if 4th button needed)
- [ ] Temperature sensor integration
- [ ] Configurable button functions via MQTT commands

---

**Version:** v1.0-aux-buttons  
**Author:** Obedio Team  
**License:** MIT  
**Hardware:** ESP32-S3 Custom PCB v3.0