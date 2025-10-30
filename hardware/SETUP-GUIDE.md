# OBEDIO ESP32 Setup & Programming Guide

**Version**: 1.0
**Date**: October 24, 2025
**Difficulty**: Beginner/Intermediate

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Software Installation](#software-installation)
3. [Hardware Assembly](#hardware-assembly)
4. [Programming ESP32 Button](#programming-esp32-button)
5. [Programming ESP32 Watch](#programming-esp32-watch)
6. [Configuration](#configuration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🛠️ Prerequisites

### Required Hardware

**For ESP32 Button**:
- [ ] ESP32 DevKit board (ESP32-WROOM-32)
- [ ] 5× Push buttons (12mm tactile)
- [ ] 1× LED (any color)
- [ ] 1× 220Ω resistor (for LED)
- [ ] Breadboard and jumper wires
- [ ] Micro USB cable
- [ ] Computer (Windows/Mac/Linux)

**For ESP32 Watch**:
- [ ] ESP32 DevKit board
- [ ] SSD1306 OLED display (128×64, I2C)
- [ ] 3× Push buttons (6mm tactile)
- [ ] 1× Vibration motor (3V coin type)
- [ ] 1× NPN transistor (2N2222 or similar)
- [ ] 1× 1kΩ resistor (for transistor base)
- [ ] Breadboard and jumper wires
- [ ] Micro USB cable

### Required Software

- [ ] Arduino IDE 2.x or VS Code + PlatformIO
- [ ] ESP32 board support package
- [ ] USB-to-UART drivers (CP2102 or CH340)
- [ ] Required Arduino libraries (listed below)

---

## 💻 Software Installation

### Option 1: Arduino IDE (Recommended for Beginners)

#### Step 1: Install Arduino IDE

1. Download Arduino IDE 2.x from [arduino.cc](https://www.arduino.cc/en/software)
2. Install for your operating system
3. Launch Arduino IDE

#### Step 2: Add ESP32 Board Support

1. Open Arduino IDE
2. Go to **File** → **Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Click **OK**
5. Go to **Tools** → **Board** → **Boards Manager**
6. Search for "ESP32"
7. Install **"ESP32 by Espressif Systems"**
8. Wait for installation to complete

#### Step 3: Install USB Drivers

**For CP2102 (most ESP32 boards)**:
- Windows: Download from [Silicon Labs](https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers)
- Mac/Linux: Usually pre-installed

**For CH340**:
- Download from manufacturer or search "CH340 driver [your OS]"

**Verify Installation**:
1. Connect ESP32 to computer via USB
2. Go to **Tools** → **Port**
3. You should see a new COM port (Windows) or `/dev/tty.usbserial*` (Mac/Linux)

#### Step 4: Install Required Libraries

**For ESP32 Button**:
1. Go to **Sketch** → **Include Library** → **Manage Libraries**
2. Install these libraries:
   - `PubSubClient` by Nick O'Leary (for MQTT)
   - `ArduinoJson` by Benoit Blanchon (for JSON)

**For ESP32 Watch** (additional):
1. In Library Manager, also install:
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`

### Option 2: VS Code + PlatformIO (Advanced Users)

<details>
<summary>Click to expand PlatformIO instructions</summary>

#### Step 1: Install VS Code
1. Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install for your operating system

#### Step 2: Install PlatformIO Extension
1. Open VS Code
2. Go to **Extensions** (Ctrl+Shift+X)
3. Search for "PlatformIO IDE"
4. Click **Install**
5. Restart VS Code

#### Step 3: Create New Project
1. Click **PlatformIO Home** icon
2. Click **New Project**
3. Name: "obedio-button" or "obedio-watch"
4. Board: "ESP32 Dev Module"
5. Framework: "Arduino"
6. Click **Finish**

#### Step 4: Configure platformio.ini

**For Button**:
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^6.21.3
monitor_speed = 115200
```

**For Watch**:
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^6.21.3
    adafruit/Adafruit GFX Library@^1.11.9
    adafruit/Adafruit SSD1306@^2.5.10
monitor_speed = 115200
```

</details>

---

## 🔌 Hardware Assembly

### ESP32 Button Wiring

```
┌─────────────────────────────────────┐
│           ESP32 DevKit              │
│                                     │
│  GPIO 21 ────────┐                 │
│  GPIO 19 ────────┤                 │
│  GPIO 18 ────────┤  [Buttons]      │
│  GPIO 5  ────────┤   (5 buttons    │
│  GPIO 17 ────────┘    with pull-up)│
│                                     │
│  GPIO 2  ─────── [LED] ─ 220Ω ─ GND│
│                                     │
│  GPIO 34 ─────── Battery Voltage    │
│                  (via divider)      │
│                                     │
│  GND ───────────── Common Ground    │
│  3V3 ───────────── VCC              │
└─────────────────────────────────────┘
```

#### Button Connections (INPUT_PULLUP mode)

**Each button**:
- One side → GPIO pin
- Other side → GND

**Why**: ESP32 has internal pull-up resistors, so we connect buttons to GND.

#### LED Connection

- LED Anode (+) → GPIO 2
- LED Cathode (-) → 220Ω resistor → GND

### ESP32 Watch Wiring

```
┌─────────────────────────────────────────────┐
│              ESP32 DevKit                   │
│                                             │
│  ┌─────── OLED Display (I2C) ─────┐        │
│  │  GPIO 22 (SCL) ────────── SCL  │        │
│  │  GPIO 21 (SDA) ────────── SDA  │        │
│  │  3V3 ──────────────────── VCC  │        │
│  │  GND ──────────────────── GND  │        │
│  └─────────────────────────────────┘        │
│                                             │
│  ┌──── Vibration Motor ────┐               │
│  │  GPIO 14 ─┬─ Base (1kΩ) │               │
│  │          NPN Transistor  │               │
│  │  3V3 ────── Motor (+)    │               │
│  │  GND ────── Collector    │               │
│  └──────────────────────────┘               │
│                                             │
│  GPIO 25 ───── Button UP    (to GND)       │
│  GPIO 26 ───── Button SELECT (to GND)      │
│  GPIO 27 ───── Button DOWN  (to GND)       │
│                                             │
│  GPIO 34 ───── Battery Voltage              │
│  GPIO 2  ───── LED                          │
└─────────────────────────────────────────────┘
```

#### OLED Display (I2C)

- **VCC** → 3.3V (NOT 5V!)
- **GND** → GND
- **SCL** → GPIO 22
- **SDA** → GPIO 21

#### Vibration Motor with Transistor

Why transistor? GPIO pins can't provide enough current for motor.

```
        3.3V
         │
         ├──── Motor (+)
         │
      Motor (-)
         │
    Collector (C)
         │
      [2N2222]
         │
    Emitter (E)
         │
        GND

GPIO 14 ──┤1kΩ├── Base (B)
```

---

## 🔘 Programming ESP32 Button

### Step 1: Open Firmware

1. Navigate to: `hardware/esp32-button/`
2. Open `esp32-button.ino` in Arduino IDE

### Step 2: Configure Settings

Find these lines at the top of the code and change them:

```cpp
// WiFi Configuration (CHANGE THESE!)
const char* WIFI_SSID = "YourYachtWiFi";        // Your WiFi name
const char* WIFI_PASSWORD = "YourPassword";      // Your WiFi password

// MQTT Broker Configuration
const char* MQTT_BROKER = "192.168.1.100";      // Your Obedio server IP

// Device Configuration
const char* LOCATION_ID = "LOCATION_UUID_HERE"; // Get from database
```

**How to get LOCATION_ID**:
1. Open Obedio web app: http://localhost:5173
2. Go to Locations page
3. Click on the location where this button will be installed
4. Copy the Location ID (UUID format)
5. Paste it in the firmware

### Step 3: Select Board Settings

1. **Tools** → **Board** → **ESP32 Arduino** → **ESP32 Dev Module**
2. **Tools** → **Upload Speed** → **115200**
3. **Tools** → **Flash Frequency** → **80MHz**
4. **Tools** → **Port** → Select your ESP32 port

### Step 4: Compile & Upload

1. Click **Verify** (✓) button to compile
2. Wait for "Done compiling"
3. Click **Upload** (→) button
4. Wait for "Done uploading"

### Step 5: Monitor Serial Output

1. **Tools** → **Serial Monitor**
2. Set baud rate to **115200**
3. You should see:
   ```
   ========================================
   OBEDIO ESP32 Button - Starting...
   ========================================
   Device ID: BTN-XX:XX:XX:XX:XX:XX
   Location ID: [your-location-id]
   Firmware Version: 1.0.0

   🔌 Connecting to WiFi...
   ✅ WiFi connected!
   IP Address: 192.168.1.xxx

   ✅ MQTT connected!
   ✅ Button ready! Waiting for button press...
   ```

### Step 6: Test Button

1. Press any button
2. Serial Monitor should show:
   ```
   🔘 Button pressed: main
   📤 Publishing MQTT message:
   Topic: obedio/button/BTN-XX:XX:XX:XX:XX:XX/press
   Payload: {"deviceId":"BTN-...","locationId":"...",...}
   ✅ Message published successfully!
   ```

3. Check MQTT Monitor at http://localhost:8888
4. You should see the message appear!

---

## ⌚ Programming ESP32 Watch

### Step 1: Wire OLED Display FIRST

**Important**: Connect OLED before uploading firmware!
- If OLED not found, firmware will stop at boot

### Step 2: Open Firmware

1. Navigate to: `hardware/esp32-watch/`
2. Open `esp32-watch.ino` in Arduino IDE

### Step 3: Configure Settings

```cpp
// WiFi Configuration (CHANGE THESE!)
const char* WIFI_SSID = "YourYachtWiFi";
const char* WIFI_PASSWORD = "YourPassword";

// MQTT Broker Configuration
const char* MQTT_BROKER = "192.168.1.100";

// Crew Member Configuration
const char* CREW_ID = "CREW_UUID_HERE";          // Get from database
const char* CREW_NAME = "John Doe";              // Crew member name
```

**How to get CREW_ID**:
1. Open Obedio web app: http://localhost:5173
2. Go to Crew page
3. Click on the crew member
4. Copy the Crew ID (UUID format)
5. Paste it in the firmware

### Step 4: Test OLED Display First

Before uploading full firmware, test the OLED:

1. **File** → **Examples** → **Adafruit SSD1306** → **ssd1306_128x64_i2c**
2. Upload this example
3. OLED should show Adafruit logo
4. If not working, check wiring and I2C address

**Check I2C Address**:
```cpp
// In most cases it's 0x3C
// If not working, try 0x3D
#define SCREEN_ADDRESS 0x3C  // or 0x3D
```

### Step 5: Upload Watch Firmware

1. Select board settings (same as button)
2. **Verify** (✓) to compile
3. **Upload** (→) to ESP32
4. Wait for upload complete

### Step 6: Monitor Serial Output

```
========================================
OBEDIO ESP32 Watch - Starting...
========================================
Crew ID: [your-crew-id]
Crew Name: John Doe

🔌 Connecting to WiFi...
✅ WiFi connected!
IP: 192.168.1.xxx

⏰ Syncing time with NTP...

🔌 Connecting to MQTT...
✅ Connected!
📡 Subscribed to: obedio/crew/[crew-id]/notification

✅ Watch ready!
```

### Step 7: Test Watch

1. Display should show home screen:
   ```
   OBEDIO              Battery: 100%

   14:25

   John Doe
   Status: on-duty

   No requests
   ```

2. Press any button → Screen wakes up
3. Send test notification from web app
4. Watch should vibrate and show request

---

## ⚙️ Configuration

### WiFi Setup

**Static IP (recommended for production)**:
```cpp
// Add after WiFi.begin():
IPAddress local_IP(192, 168, 1, 200);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

WiFi.config(local_IP, gateway, subnet);
```

### MQTT Configuration

**With Authentication**:
```cpp
const char* MQTT_USER = "obedio";
const char* MQTT_PASSWORD = "your_secure_password";
```

**With TLS/SSL (secure)**:
```cpp
#include <WiFiClientSecure.h>
WiFiClientSecure wifiClient;
wifiClient.setInsecure(); // For testing
// Or: wifiClient.setCACert(root_ca); // For production
```

### Button Remapping

Change button functions in firmware:
```cpp
// Button Pin Configuration
#define BUTTON_MAIN_PIN 21       // Main button
#define BUTTON_AUX1_PIN 19       // Change this
#define BUTTON_AUX2_PIN 18       // Change this
#define BUTTON_AUX3_PIN 5        // Change this
#define BUTTON_AUX4_PIN 17       // Change this
```

### Battery Calibration

Adjust voltage divider for accurate reading:
```cpp
float voltage = (rawValue / 4095.0) * 3.3 * 2.0; // Adjust multiplier

// For different voltage dividers:
// - R1=10kΩ, R2=10kΩ → multiply by 2.0
// - R1=20kΩ, R2=10kΩ → multiply by 3.0
// - R1=10kΩ, R2=5kΩ  → multiply by 3.0
```

---

## 🧪 Testing

### Basic Connectivity Test

```cpp
// Add to setup() for debugging:
Serial.println("Testing MQTT connection...");
String testTopic = "obedio/test/" + DEVICE_ID;
mqttClient.publish(testTopic.c_str(), "Hello from ESP32!");
```

Check MQTT Monitor for test message.

### Button Response Time Test

```cpp
// Measure button response time:
unsigned long start = millis();
// ... button press code ...
unsigned long end = millis();
Serial.print("Response time: ");
Serial.print(end - start);
Serial.println(" ms");
```

Target: < 100ms

### Battery Life Test

1. Fully charge battery
2. Disconnect USB
3. Use device normally
4. Monitor battery level via MQTT
5. Record time until battery dies

Expected: 3-6 months for button (with deep sleep)
Expected: 8-10 hours for watch (active use)

### Range Test

1. Walk away from WiFi router with device
2. Press button at different distances
3. Monitor RSSI value in serial output
4. Find minimum RSSI for reliable operation

Target: -75 dBm or better

---

## 🐛 Troubleshooting

### Problem: ESP32 Not Detected by Computer

**Solutions**:
- Install USB drivers (CP2102 or CH340)
- Try different USB cable (must be data cable, not charge-only)
- Try different USB port
- Press and hold BOOT button while connecting
- Check Device Manager (Windows) for yellow exclamation marks

### Problem: Upload Failed / Timeout

**Solutions**:
- Hold BOOT button during upload
- Lower upload speed: **Tools** → **Upload Speed** → **115200**
- Check COM port is correct
- Close Serial Monitor during upload
- Disconnect other devices from ESP32

### Problem: WiFi Won't Connect

**Solutions**:
- Check SSID and password spelling
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Move closer to router
- Check router settings (AP isolation disabled)
- Restart router

**Debug Code**:
```cpp
Serial.print("WiFi Status: ");
Serial.println(WiFi.status());
// 0 = WL_IDLE_STATUS
// 3 = WL_CONNECTED
// 4 = WL_CONNECT_FAILED
// 6 = WL_DISCONNECTED
```

### Problem: MQTT Connection Failed

**Solutions**:
- Verify MQTT broker IP address
- Check broker is running: `docker ps | findstr mosquitto`
- Check firewall allows port 1883
- Try telnet: `telnet 192.168.1.100 1883`
- Check MQTT username/password

**MQTT Error Codes**:
```
-4 = Connection timeout
-3 = Connection lost
-2 = Connect failed
-1 = Disconnected
 0 = Connected
 1 = Bad protocol
 2 = Bad client ID
 3 = Unavailable
 4 = Bad credentials
 5 = Unauthorized
```

### Problem: OLED Display Not Working

**Solutions**:
- Check wiring (SCL/SDA swapped?)
- Try different I2C address (0x3C or 0x3D)
- Check power supply (3.3V, not 5V!)
- Run I2C scanner sketch
- Try different OLED module

**I2C Scanner**:
```cpp
#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(115200);
  Serial.println("I2C Scanner");
}

void loop() {
  for(byte i = 0; i < 127; i++) {
    Wire.beginTransmission(i);
    if(Wire.endTransmission() == 0) {
      Serial.print("Found: 0x");
      Serial.println(i, HEX);
    }
  }
  delay(5000);
}
```

### Problem: Buttons Not Responding

**Solutions**:
- Check button wiring
- Test with multimeter (continuity test)
- Verify GPIO pins in code match physical wiring
- Check GND connection
- Try external pull-down resistors (10kΩ)

**Button Test Code**:
```cpp
void loop() {
  Serial.print("Button states: ");
  Serial.print(digitalRead(BUTTON_MAIN_PIN));
  Serial.print(" ");
  Serial.print(digitalRead(BUTTON_AUX1_PIN));
  // ... etc
  Serial.println();
  delay(100);
}
```

### Problem: Battery Not Charging

**Solutions**:
- Check TP4056 module LED (red = charging, blue/green = full)
- Verify battery polarity (+/- correct)
- Test battery voltage with multimeter
- Check USB power supply (min 5V 1A)
- Replace TP4056 module if damaged

---

## 📚 Additional Resources

### Documentation
- [ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- [Arduino ESP32 GitHub](https://github.com/espressif/arduino-esp32)
- [PubSubClient Library](https://pubsubclient.knolleary.net/)
- [Adafruit GFX Guide](https://learn.adafruit.com/adafruit-gfx-graphics-library)

### Tools
- [ESP32 Pinout Reference](https://randomnerdtutorials.com/esp32-pinout-reference-gpios/)
- [MQTT Explorer](http://mqtt-explorer.com/) - Desktop MQTT client
- [EasyEDA](https://easyeda.com/) - PCB design tool
- [Fritzing](https://fritzing.org/) - Circuit design tool

### Community
- [ESP32 Forum](https://www.esp32.com/)
- [Arduino Forum](https://forum.arduino.cc/)
- [Reddit r/esp32](https://reddit.com/r/esp32)

---

## 🎯 Next Steps

After successfully programming and testing:

1. **Deploy Prototypes**
   - Install 2-3 buttons in test locations
   - Give 1-2 watches to crew members
   - Monitor for 1 week

2. **Collect Feedback**
   - Range issues?
   - Battery life?
   - Button responsiveness?
   - Display readability?

3. **Optimize Firmware**
   - Adjust timing parameters
   - Improve power management
   - Add features based on feedback

4. **Scale Production**
   - Design custom PCB
   - Order components in bulk
   - Set up assembly process
   - Create quality control procedures

---

**Questions or Issues?**

Check the [Troubleshooting](#troubleshooting) section or create an issue in the project repository.

---

*Document Version: 1.0*
*Last Updated: October 24, 2025*
*Support: OBEDIO Development Team*
