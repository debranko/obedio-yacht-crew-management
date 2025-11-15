# T-Watch Display Firmware - Setup Guide

Complete firmware for LilyGO T-Watch S3 with display, touch, and vibration support.

---

## Features

- ✅ **WiFi + MQTT** connection
- ✅ **TFT Display** - Shows service requests on 240x240 screen
- ✅ **Touch Screen** - Tap to acknowledge notifications
- ✅ **Vibration** - Alert patterns (1 pulse = normal, 3 pulses = urgent)
- ✅ **MQTT Topics**:
  - Subscribe: `obedio/watch/{deviceId}/notification`
  - Publish: `obedio/watch/{deviceId}/acknowledge`

---

## Hardware Requirements

- **LilyGO T-Watch S3**
- **USB-C Cable**
- **Computer** with Arduino IDE

---

## Arduino IDE Setup

### 1. Install Arduino IDE

Download from: https://www.arduino.cc/en/software

### 2. Add ESP32 Board Support

**File → Preferences → Additional Board Manager URLs:**
```
https://espressif.github.io/arduino-esp32/package_esp32_index.json
```

**Tools → Board → Boards Manager:**
- Search: **"esp32"**
- Install: **"esp32 by Espressif Systems"** (version 3.0.0 or later)

### 3. Install Required Libraries

**Sketch → Include Library → Manage Libraries:**

Install these libraries:

1. **TFT_eSPI** (version 2.5.0 or later)
   - By Bodmer
   - ⚠️ **IMPORTANT**: See configuration below!

2. **PubSubClient** (version 2.8.0 or later)
   - By Nick O'Leary
   - For MQTT communication

3. **ArduinoJson** (version 7.0.0 or later)
   - By Benoit Blanchon
   - For JSON parsing

**Wire** library is built-in (no installation needed)

---

## TFT_eSPI Configuration

⚠️ **CRITICAL STEP!**

The `TFT_eSPI` library needs custom configuration for T-Watch S3.

### Option 1: Copy User_Setup.h (Recommended)

1. **Locate** the `User_Setup.h` file in this folder
2. **Copy** it to Arduino TFT_eSPI library folder:

**Windows:**
```
C:\Users\{YourName}\Documents\Arduino\libraries\TFT_eSPI\User_Setup.h
```

**Mac:**
```
~/Documents/Arduino/libraries/TFT_eSPI/User_Setup.h
```

**Linux:**
```
~/Arduino/libraries/TFT_eSPI/User_Setup.h
```

3. **Replace** the existing `User_Setup.h` file

### Option 2: Manual Configuration

Edit `TFT_eSPI/User_Setup.h`:

```cpp
// Driver
#define ST7789_DRIVER

// Display size
#define TFT_WIDTH  240
#define TFT_HEIGHT 240

// ESP32-S3 Pin Configuration
#define TFT_MOSI 11
#define TFT_SCLK 12
#define TFT_CS   6
#define TFT_DC   7
#define TFT_RST  8
#define TFT_BL   38

// SPI frequency
#define SPI_FREQUENCY  40000000
```

---

## Upload Firmware

### 1. Connect T-Watch

- Connect T-Watch S3 to computer via USB-C
- Power on the watch

### 2. Configure Arduino IDE

**Tools → Board:**
- Select: **"ESP32S3 Dev Module"**

**Tools → USB CDC On Boot:**
- Select: **"Enabled"**

**Tools → Flash Size:**
- Select: **"16MB (128Mb)"**

**Tools → Partition Scheme:**
- Select: **"Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)"**

**Tools → Port:**
- Select your COM port (e.g., COM3, /dev/ttyUSB0)

### 3. Open Firmware

- Open `twatch-display.ino` in Arduino IDE

### 4. Verify WiFi Settings

Check lines 23-24:
```cpp
const char* WIFI_SSID = "ALHN-B38A";
const char* WIFI_PASSWORD = "96305619";
```

### 5. Verify MQTT Broker

Check lines 26-27:
```cpp
const char* MQTT_BROKER = "192.168.5.152";
const int MQTT_PORT = 1883;
```

### 6. Upload

1. Click **Upload** button (→) in Arduino IDE
2. Wait for compilation and upload
3. Watch Serial Monitor for status

---

## Serial Monitor

**Tools → Serial Monitor** (Ctrl+Shift+M)

**Baud Rate: 115200**

You should see:
```
===========================================
OBEDIO T-Watch Display
===========================================

👆 Initializing touch...
📺 Initializing display...
📶 Connecting to WiFi...
✅ WiFi connected!
IP Address: 192.168.5.145
Device ID: TWATCH-64E8337A0BAC
📡 Connecting to MQTT broker...
✅ MQTT connected!
📥 Subscribed to: obedio/watch/TWATCH-64E8337A0BAC/notification
📤 Registering device with backend...
✅ Registration message sent!
💓 Heartbeat sent (uptime: 30s)
```

---

## Testing

### 1. Check Device Manager

- Open: http://localhost:5173/device-manager
- Click: **Watches** tab
- You should see your T-Watch listed!

### 2. Assign to Crew Member

- Go to: **Crew** page
- Click on a crew member
- In **"Assigned Device"** section:
  - Select your T-Watch from dropdown
  - Click **Assign**

### 3. Test Service Request

- Use **Button Simulator** or **real Heltec button**
- Press button assigned to a location
- **T-Watch should:**
  - 📳 **Vibrate** (1 pulse for normal, 3 for urgent)
  - 📺 **Display** service request with location
  - 🟢 **Show** "TAP TO ACK" button

### 4. Test Acknowledgement

- **Tap** anywhere on T-Watch screen
- **T-Watch should:**
  - Show "ACK!" confirmation
  - Send MQTT acknowledge message
  - Return to ready screen

---

## Display Screens

### Startup Screen
```
╔══════════════════════════════════╗
║                                  ║
║         OBEDIO                   ║
║         T-Watch                  ║
║         v0.2-display             ║
║                                  ║
╚══════════════════════════════════╝
```

### Ready Screen
```
╔══════════════════════════════════╗
║       OBEDIO        [Green]      ║
╠══════════════════════════════════╣
║ Status: Ready                    ║
║ Signal: -69 dBm                  ║
║ Device: 64E8337A0BAC             ║
║                                  ║
║ Waiting for requests...          ║
╚══════════════════════════════════╝
```

### Notification Screen
```
╔══════════════════════════════════╗
║  Service Request    [Green/Red]  ║
╠══════════════════════════════════╣
║ Location:                        ║
║ Main Saloon                      ║
║                                  ║
║ Request:                         ║
║ Guest needs assistance           ║
║                                  ║
║ Time: 00:15:23                   ║
║ ┌──────────────────┐             ║
║ │  TAP TO ACK      │ [Button]    ║
║ └──────────────────┘             ║
╚══════════════════════════════════╝
```

### Acknowledgement Screen
```
╔══════════════════════════════════╗
║                                  ║
║           ACK!                   ║
║    [Green, Large]                ║
║                                  ║
║   Request acknowledged           ║
║                                  ║
╚══════════════════════════════════╝
```

---

## Troubleshooting

### Compilation Errors

**Error: "TFT_eSPI.h: No such file or directory"**
- Install TFT_eSPI library (see step 3)

**Error: "PubSubClient.h: No such file or directory"**
- Install PubSubClient library (see step 3)

**Error: "'class TFT_eSPI' has no member named 'init'"**
- Wrong TFT_eSPI configuration
- Copy correct `User_Setup.h` file

### Upload Errors

**Error: "Failed to connect to ESP32"**
- Press and hold **BOOT** button on T-Watch while uploading
- Check USB cable (must support data transfer)
- Try different USB port

**Error: "Serial port not found"**
- Install CH340/CP2102 USB drivers
- Check Device Manager (Windows) for COM port

### Display Issues

**Black screen / No display:**
- Check backlight pin (GPIO 38)
- Verify TFT_eSPI configuration
- Test with `TFT_eSPI → Examples → Hello World`

**Wrong colors / garbled display:**
- Wrong driver selected (must be ST7789)
- Wrong pin configuration
- Check SPI frequency (try 20MHz instead of 40MHz)

### Touch Not Working

**No touch response:**
- Check I2C pins (SDA=39, SCL=40)
- Verify touch controller address (0x15)
- Add Serial.println to readTouch() for debugging

**Touch coordinates wrong:**
- May need calibration in readTouch() function
- Check display rotation setting

### MQTT Issues

**Can't connect to MQTT:**
- Verify broker IP address (192.168.5.152)
- Check WiFi connection
- Ping broker from computer: `ping 192.168.5.152`
- Check Mosquitto is running: `docker ps`

**Not receiving notifications:**
- Verify subscription topic matches backend
- Check MQTT Monitor page for messages
- Increase MQTT buffer size (already set to 1024)

---

## Hardware Specifications

### T-Watch S3 Pinout

| Component | Pin | Description |
|-----------|-----|-------------|
| **Display** |
| TFT_MOSI | 11 | SPI Data |
| TFT_SCLK | 12 | SPI Clock |
| TFT_CS | 6 | Chip Select |
| TFT_DC | 7 | Data/Command |
| TFT_RST | 8 | Reset |
| TFT_BL | 38 | Backlight |
| **Touch** |
| TOUCH_SDA | 39 | I2C Data |
| TOUCH_SCL | 40 | I2C Clock |
| TOUCH_INT | 14 | Interrupt |
| TOUCH_RST | 13 | Reset |
| **Other** |
| VIBRATION | 4 | Motor Control |

---

## Next Steps

1. ✅ Upload firmware to T-Watch
2. ✅ Verify device appears in Device Manager
3. ✅ Assign T-Watch to crew member
4. ✅ Test service request notification
5. ✅ Test touch acknowledgement
6. ⏳ Upload Heltec button firmware
7. ⏳ Test end-to-end button → watch flow

---

**Firmware Version:** v0.2-display
**Hardware:** LilyGO T-Watch S3
**Created:** October 24, 2025
**Status:** Ready for testing
