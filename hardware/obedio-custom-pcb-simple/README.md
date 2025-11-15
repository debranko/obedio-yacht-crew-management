# OBEDIO Custom PCB Smart Button - ESP32-S3

Complete firmware for custom PCB with ESP32-S3, MCP23017 IO expander, LIS3DHTR accelerometer, and NeoPixel LEDs.

## Hardware Specifications

### ESP32-S3 Custom PCB
- **MCU:** ESP32-S3-WROOM-1
- **Flash:** 8MB
- **PSRAM:** 2MB
- **WiFi:** 2.4GHz 802.11 b/g/n
- **Bluetooth:** BLE 5.0

### Connected Peripherals

#### I2C Bus (Shared)
| Component | I2C Address | SDA Pin | SCL Pin |
|-----------|-------------|---------|---------|
| MCP23017 IO Expander | 0x20 | GPIO 3 | GPIO 2 |
| LIS3DHTR Accelerometer | 0x19 | GPIO 3 | GPIO 2 |

#### Buttons (via MCP23017 GPA Bank)
| Button | MCP Pin | Label | MQTT Name | Function |
|--------|---------|-------|-----------|----------|
| T1 | GPA7 | Main | main | Service call / voice recording |
| T2 | GPA6 | Aux 1 | aux1 | Call service |
| T3 | GPA5 | Aux 2 | aux2 | Lights control (Crestron) |
| T4 | GPA4 | Aux 3 | aux3 | Prepare food request |
| T5 | GPA3 | Aux 4 | aux4 | Bring drinks request |
| T6 | GPA0 | Aux 5 | aux5 | **Toggle Do Not Disturb** |

**Note:** T6 (GPA0) uses inverted logic (active HIGH instead of LOW).

#### Touch Sensor (Capacitive)
| Pin | GPIO | Type | Threshold | Function |
|-----|------|------|-----------|----------|
| Touch | GPIO 1 | Capacitive | < 40 | Alternative to physical button press |

#### NeoPixel LEDs
| Component | GPIO | Count | Type |
|-----------|------|-------|------|
| LED Strip | GPIO 17 | 16 LEDs | WS2812B (GRB) |

#### Accelerometer (LIS3DHTR)
| Parameter | Value |
|-----------|-------|
| Data Rate | 50 Hz |
| Range | ±2G |
| Shake Threshold | 3.5 G-force |

## Firmware Features (v2.0-enhanced)

### Press Type Detection

| Press Type | Detection | Duration | MQTT Value | LED Color | Priority |
|------------|-----------|----------|------------|-----------|----------|
| **Single Press** | Quick tap | < 700ms | "single" | White | Normal |
| **Double-Click** | Two quick taps | < 500ms apart | "double" | Yellow | Urgent |
| **Long Press** | Hold button | ≥ 700ms | "long" | Blue | Normal (voice) |
| **Touch** | Capacitive touch | Any | "touch" | Cyan | Normal |
| **Double-Touch** | Two quick touches | < 500ms apart | "double-touch" | Purple | Urgent |
| **Shake** | Accelerometer | > 3.5 G | "shake" | Red | Emergency |

### Button Functions

#### Main Button (T1)
- **Single press:** Create service request
- **Double-click:** Create urgent service request
- **Long press (≥700ms):** Record voice message
- **Touch:** Alternative service request (capacitive)
- **Double-touch:** Alternative urgent request (capacitive)

#### Auxiliary Buttons
- **T2 (aux1):** Call service
- **T3 (aux2):** Toggle lights (Crestron integration)
- **T4 (aux3):** Request food preparation
- **T5 (aux4):** Request drinks
- **T6 (aux5):** Toggle Do Not Disturb mode ⭐

#### Accelerometer
- **Shake (>3.5G):** Emergency alert with red LEDs

### MQTT Integration

#### Topics
```
obedio/button/{deviceId}/press       - Button press events
obedio/device/register               - Device registration
obedio/device/heartbeat              - Keepalive messages
```

#### Button Press Message Format
```json
{
  "deviceId": "BTN-3CDC756DB958",
  "button": "main",
  "pressType": "single",
  "battery": 100,
  "rssi": -45,
  "firmwareVersion": "v2.0-enhanced",
  "timestamp": 123456,
  "sequenceNumber": 42
}
```

## Arduino IDE Setup

### 1. Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add to "Additional Board Manager URLs":
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "ESP32" and install **esp32 by Espressif Systems**

### 2. Install Required Libraries

Go to **Sketch → Include Library → Manage Libraries** and install:

| Library | Version | Purpose |
|---------|---------|---------|
| Adafruit MCP23017 | Latest | IO expander for buttons |
| Adafruit NeoPixel | Latest | LED control |
| PubSubClient | Latest | MQTT communication |
| ArduinoJson | Latest | JSON message formatting |
| Grove 3-Axis Digital Accelerometer(±16g) | Latest | LIS3DHTR accelerometer |

**Important:** For LIS3DHTR, search for "Grove 3-Axis" in Library Manager.

### 3. Board Configuration

1. Connect ESP32-S3 via USB
2. Select board: **Tools → Board → ESP32 Arduino → ESP32S3 Dev Module**
3. Configure settings:

| Setting | Value |
|---------|-------|
| USB CDC On Boot | Enabled |
| USB Mode | Hardware CDC and JTAG |
| Flash Size | 8MB (64Mb) |
| Partition Scheme | Default 4MB with spiffs |
| PSRAM | QSPI PSRAM |
| Upload Speed | 921600 |
| Port | (Select your COM port) |

### 4. Upload Firmware

1. Open `obedio-custom-pcb-simple.ino` in Arduino IDE
2. Update WiFi credentials (lines 17-18):
   ```cpp
   const char* ssid = "YourNetworkName";
   const char* password = "YourPassword";
   ```
3. Update MQTT server IP (line 19):
   ```cpp
   const char* mqtt_server = "10.10.0.207";  // Your backend server IP
   ```
4. Click **Upload** (→)
5. Monitor progress in output window
6. Open **Serial Monitor** (115200 baud) to verify operation

## Serial Monitor Output

Expected startup sequence:
```
NeoPixel initialized
I2C initialized
MCP23017 initialized
Buttons initialized
LIS3DHTR accelerometer initialized
Connecting to WiFi...
WiFi connected
IP: 10.10.0.207
Device ID: BTN-3CDC756DB958
Connecting to MQTT... connected
Device registered
Setup complete!
```

### Testing Button Presses

Watch for these messages when testing:
```
Button T1 pressed down
Button T1 released after 150ms
Published: main (single)

Touch detected - value: 25
Touch released after 200ms
Single touch detected!
Published: main (touch)

Button T6 pressed down
Button T6 released after 120ms
DND button pressed - toggling DND
Published: aux5 (single)
```

## Troubleshooting

### WiFi Connection Issues
**Symptom:** Continuous dots in serial monitor
```
Connecting to WiFi...
............................
```
**Solutions:**
- Verify SSID and password are correct
- Check 2.4GHz WiFi is enabled (ESP32 doesn't support 5GHz)
- Move closer to WiFi router
- Check WiFi network allows IoT devices

### MQTT Connection Fails
**Symptom:** `failed (rc=-2), retry in 5s`

**Solutions:**
- Verify MQTT broker is running: `docker ps | grep mosquitto`
- Check backend IP address is correct
- Test MQTT broker: `mosquitto_sub -h 10.10.0.207 -t '#' -v`
- Verify firewall allows port 1883

### MCP23017 Not Found
**Symptom:** Red blinking LEDs, `ERROR: MCP23017 not found!`

**Solutions:**
- Check I2C connections (SDA=GPIO3, SCL=GPIO2)
- Verify MCP23017 address jumpers (should be 0x20)
- Test I2C bus with I2C scanner sketch
- Check power supply to MCP23017

### Accelerometer Issues
**Symptom:** No shake detection

**Solutions:**
- Verify I2C connections (shared with MCP23017)
- Check LIS3DHTR address (0x19)
- Increase shake threshold if too sensitive
- Decrease shake threshold if not sensitive enough
- Edit line 41: `#define SHAKE_THRESHOLD 3.5`

### Touch Not Working
**Symptom:** No touch detection

**Solutions:**
- Verify GPIO1 is connected to touch pad
- Adjust touch threshold (line 45): `#define TOUCH_THRESHOLD 40`
- Lower threshold = more sensitive
- Higher threshold = less sensitive
- Test touch values in Serial Monitor

### Button Presses Not Detected
**Symptom:** Buttons don't trigger actions

**Solutions:**
- Verify button wiring to MCP23017 GPA pins
- Check pull-up resistors are enabled
- For T6 (aux5): Remember it uses inverted logic
- Check button connections aren't loose

### LED Strip Not Working
**Symptom:** No LED feedback

**Solutions:**
- Verify GPIO17 connection to LED strip
- Check LED strip power supply (5V)
- Verify LED count matches `#define NUM_LEDS 16`
- Test with simple NeoPixel example sketch

## Configuration Options

### Adjustable Thresholds

```cpp
// Accelerometer sensitivity
#define SHAKE_THRESHOLD 3.5  // Increase = less sensitive, Decrease = more sensitive

// Touch sensor sensitivity
#define TOUCH_THRESHOLD 40   // Lower = more sensitive, Higher = less sensitive

// Press timing
const unsigned long longPressTime = 700;      // Long press duration (ms)
const unsigned long doubleClickWindow = 500;  // Double-click window (ms)
const unsigned long doubleTouchWindow = 500;  // Double-touch window (ms)

// LED brightness
strip.setBrightness(200);  // 0-255 (line 268 in setup())
```

### WiFi & MQTT Settings

```cpp
// Network configuration (lines 17-20)
const char* ssid = "Obedio";
const char* password = "BrankomeinBruder:)";
const char* mqtt_server = "10.10.0.207";
const int mqtt_port = 1883;
```

## Pin Reference Card

```
ESP32-S3 Custom PCB - Pin Mapping
═══════════════════════════════════════════════

I2C BUS
├── SDA: GPIO 3
├── SCL: GPIO 2
├── MCP23017: 0x20
└── LIS3DHTR: 0x19

BUTTONS (via MCP23017)
├── T1 (main):  GPA7 → Service call / Voice
├── T2 (aux1):  GPA6 → Call service
├── T3 (aux2):  GPA5 → Lights control
├── T4 (aux3):  GPA4 → Food request
├── T5 (aux4):  GPA3 → Drinks request
└── T6 (aux5):  GPA0 → DND toggle ⭐

TOUCH SENSOR
└── GPIO 1: Capacitive touch input

LEDS
└── GPIO 17: 16x WS2812B NeoPixels

ACCELEROMETER
└── LIS3DHTR (I2C): Shake detection
```

## Backend Integration

The firmware communicates with the Obedio backend via MQTT. The backend automatically:

1. **Registers the device** on first connection
2. **Creates service requests** based on button presses
3. **Handles DND toggle** for location (aux5 button)
4. **Routes notifications** to crew watches
5. **Logs all events** to database

### Press Type → Service Request Mapping

| Press Type | Request Type | Priority |
|------------|--------------|----------|
| single | call | normal |
| double | call | urgent |
| long | voice | normal |
| touch | call | normal |
| double-touch | urgent_call | urgent |
| shake | emergency | emergency |

### Button → Service Type Mapping

| Button | Service Type | Creates Request? |
|--------|--------------|------------------|
| main | call | ✅ Yes |
| aux1 | call_service | ✅ Yes |
| aux2 | lights | ❌ No (Crestron) |
| aux3 | prepare_food | ✅ Yes |
| aux4 | bring_drinks | ✅ Yes |
| aux5 | dnd | ❌ No (DND toggle) |

## Testing Checklist

After uploading firmware, test each feature:

- [ ] **WiFi Connection:** Verify IP address in Serial Monitor
- [ ] **MQTT Connection:** Check "Device registered" message
- [ ] **Main Button - Single Press:** White LEDs → Service request created
- [ ] **Main Button - Double-Click:** Yellow LEDs → Urgent request created
- [ ] **Main Button - Long Press:** Blue LEDs → Voice recording
- [ ] **Touch Sensor - Single Touch:** Cyan LEDs → Service request
- [ ] **Touch Sensor - Double-Touch:** Purple LEDs → Urgent request
- [ ] **Shake Detection:** Red LEDs → Emergency alert
- [ ] **DND Button (T6/aux5):** White LEDs → DND toggle
- [ ] **All Aux Buttons:** Test aux1-4 functionality
- [ ] **LED Rainbow:** Continuous animation when idle

## Firmware Versions

### v2.0-enhanced (Current)
- ✅ Capacitive touch sensor support
- ✅ Double-click detection
- ✅ Double-touch detection
- ✅ Long press for voice recording
- ✅ DND button (aux5)
- ✅ Reduced accelerometer sensitivity (3.5G)
- ✅ Fixed MQTT topic format
- ✅ Distinct LED colors per press type
- ✅ Enhanced button debouncing

### v1.0-simple (Legacy)
- Basic button press detection
- Accelerometer shake detection
- Rainbow LED animation
- MQTT communication
- Device registration

## Support

For issues or questions:
- Check Serial Monitor output at 115200 baud
- Verify all connections match pin reference
- Test with virtual button in webapp first
- Check MQTT broker logs: `docker logs obedio-mosquitto`
- Review backend logs for MQTT messages

## License

Part of the OBEDIO Yacht Crew Management System.
