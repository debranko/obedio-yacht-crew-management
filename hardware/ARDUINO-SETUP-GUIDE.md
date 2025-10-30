# Arduino IDE Setup Guide - OBEDIO ESP32 Devices

**Quick guide to program Heltec WiFi LoRa 32 V3 and LilyGO T-Watch S3**

---

## 1. Install Arduino IDE

### Download and Install

1. Go to: https://www.arduino.cc/en/software
2. Download **Arduino IDE 2.3.2** (latest version)
3. Install on your computer
4. Launch Arduino IDE

---

## 2. Install ESP32 Board Support

### Add ESP32 Board Manager URL

1. Open Arduino IDE
2. Go to **File → Preferences** (or **Arduino IDE → Settings** on Mac)
3. Find **Additional Boards Manager URLs**
4. Add this URL:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
5. Click **OK**

### Install ESP32 Boards

1. Go to **Tools → Board → Boards Manager**
2. Search for: `esp32`
3. Find **"esp32 by Espressif Systems"**
4. Click **Install** (install version 2.0.14 or later)
5. Wait for installation to complete (~5 minutes)

---

## 3. Install Required Libraries

### Heltec WiFi LoRa 32 V3 Libraries

Open **Tools → Manage Libraries** and install:

1. **Heltec ESP32 Dev-Boards** by Heltec Automation
   - Search: `Heltec ESP32`
   - Version: Latest (e.g., 1.1.5 or newer)
   - This includes display drivers

2. **PubSubClient** by Nick O'Leary
   - Search: `PubSubClient`
   - Version: Latest (e.g., 2.8.0)
   - For MQTT communication

3. **ArduinoJson** by Benoit Blanchon
   - Search: `ArduinoJson`
   - Version: 6.x (NOT 7.x yet)
   - For JSON message handling

### LilyGO T-Watch S3 Libraries

1. **TFT_eSPI** by Bodmer
   - Search: `TFT_eSPI`
   - Version: Latest (e.g., 2.5.43)
   - For display control

2. **PubSubClient** (already installed above)

3. **ArduinoJson** (already installed above)

---

## 4. Configure Heltec WiFi LoRa 32 V3

### Select Board

1. Connect Heltec device via USB-C cable
2. Go to **Tools → Board → ESP32 Arduino**
3. Select: **"WiFi LoRa 32(V3) / Wireless shell(V3) / Wireless stick lite (V3)"**

### Configure Settings

- **Upload Speed**: 921600
- **CPU Frequency**: 240MHz (WiFi/BT)
- **Flash Frequency**: 80MHz
- **Flash Mode**: QIO
- **Flash Size**: 8MB (64Mb)
- **Partition Scheme**: Default 4MB with spiffs
- **Core Debug Level**: None (or Info for debugging)
- **PSRAM**: Disabled
- **Arduino Runs On**: Core 1
- **Events Run On**: Core 1

### Select Port

- **Port**: Select the COM port for your Heltec device
  - Windows: COM3, COM4, etc.
  - Mac: /dev/cu.usbserial-XXXX
  - Linux: /dev/ttyUSB0, etc.

---

## 5. Upload Heltec Firmware

### Open Firmware

1. Open: `hardware/heltec-minimal/heltec-minimal.ino`
2. Verify WiFi credentials are correct:
   ```cpp
   const char* WIFI_SSID = "NOVA_1300";
   const char* WIFI_PASSWORD = "need9963";
   const char* MQTT_BROKER = "192.168.5.152";
   ```

### Upload

1. Click **Upload** button (→ arrow icon)
2. Wait for compilation (~30 seconds first time)
3. Upload will start automatically
4. **If upload fails**: Hold **BOOT** button during upload

### Monitor Serial Output

1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. Press **RESET** button on device
4. You should see:
   ```
   ========================================
   OBEDIO - Heltec Minimal Connection Test
   ========================================

   Device ID: HELTEC-XXXXXXXXXXXX
   Device Type: smart_button
   Firmware: v0.1-minimal

   🔌 Connecting to WiFi...
   SSID: NOVA_1300
   ✅ WiFi connected!
   IP Address: 192.168.5.XXX
   RSSI: -XX dBm

   🔌 Connecting to MQTT broker...
   Broker: 192.168.5.152:1883
   ✅ MQTT connected!

   📤 Registering device with backend...
   ✅ Registration message sent!

   ✅ Setup complete! Device is connected.

   💓 Heartbeat sent (uptime: 30s)
   💓 Heartbeat sent (uptime: 60s)
   ...
   ```

### Check OLED Display

The display should show:
```
✓ REGISTERED

Heltec Dev Button
ID: HELTEC-XXXXXX

WiFi: -XXdBm
```

---

## 6. Configure LilyGO T-Watch S3

### Select Board

1. Connect T-Watch S3 via USB-C cable
2. Go to **Tools → Board → ESP32 Arduino**
3. Select: **"ESP32S3 Dev Module"**

### Configure Settings

- **Upload Speed**: 921600
- **USB Mode**: Hardware CDC and JTAG
- **USB CDC On Boot**: Enabled
- **USB Firmware MSC On Boot**: Disabled
- **USB DFU On Boot**: Disabled
- **Upload Mode**: UART0 / Hardware CDC
- **CPU Frequency**: 240MHz (WiFi)
- **Flash Mode**: QIO 80MHz
- **Flash Size**: 16MB (128Mb)
- **Partition Scheme**: 16M Flash (3MB APP/9.9MB FATFS)
- **Core Debug Level**: None
- **PSRAM**: OPI PSRAM
- **Arduino Runs On**: Core 1
- **Events Run On**: Core 1

### Select Port

- **Port**: Select the COM port for your T-Watch

---

## 7. Upload T-Watch Firmware

### Open Firmware

1. Open: `hardware/twatch-minimal/twatch-minimal.ino`
2. Verify WiFi credentials are correct (same as Heltec)

### Upload

1. Click **Upload** button
2. Wait for compilation
3. **If upload fails**: Try pressing **BOOT** button during upload

### Monitor Serial Output

Should see similar output to Heltec:
```
========================================
OBEDIO - T-Watch Minimal Connection Test
========================================

Device ID: TWATCH-XXXXXXXXXXXX
Device Type: wearable
Firmware: v0.1-minimal

🔌 Connecting to WiFi...
✅ WiFi connected!
...
```

### Check T-Watch Display

The display should show:
```
✓ REGISTERED

T-Watch Dev
ID: TWATCH-XXXXXX

WiFi: -XXdBm
Status: Online
```

---

## 8. Verify in Device Manager

### Backend Should Be Running

Make sure your OBEDIO backend is running:
```bash
docker ps
```

You should see `mosquitto` and `postgres` containers running.

### Open Web Application

1. Open browser: http://localhost:5173
2. Login as admin
3. Go to **Device Manager** page

### Check Devices

You should see both devices listed:

**Heltec Device**:
- Device ID: HELTEC-XXXXXXXXXXXX
- Name: Heltec Dev Button
- Type: Smart Button
- Status: Online (green)
- Hardware: Heltec WiFi LoRa 32 V3
- Firmware: v0.1-minimal

**T-Watch Device**:
- Device ID: TWATCH-XXXXXXXXXXXX
- Name: T-Watch Dev
- Type: Wearable
- Status: Online (green)
- Hardware: LilyGO T-Watch S3
- Firmware: v0.1-minimal

---

## 9. Troubleshooting

### Device Won't Connect to WiFi

**Check WiFi Credentials**:
- Verify SSID is exactly: `NOVA_1300`
- Verify password is exactly: `need9963`
- Make sure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)

**Check Signal Strength**:
- Move device closer to WiFi router
- RSSI should be > -75 dBm for stable connection

**Restart Device**:
- Press RESET button on device
- Check Serial Monitor for error messages

### Device Won't Connect to MQTT

**Check Broker IP**:
- Verify IP address is: `192.168.5.152`
- Ping the server: `ping 192.168.5.152`

**Check Mosquitto is Running**:
```bash
docker ps | grep mosquitto
```

**Check Port is Open**:
```bash
telnet 192.168.5.152 1883
```

**Check Backend Logs**:
```bash
docker logs obedio-backend-1
```

Should see:
```
✅ Subscribed to obedio/device/register
✅ Subscribed to obedio/device/heartbeat
```

### Device Not Appearing in Device Manager

**Check Backend MQTT Connection**:
Look at backend logs for:
```
📱 Device registration: { deviceId: 'HELTEC-...' ... }
✅ Device created: Heltec Dev Button
```

**Check Frontend WebSocket**:
Open browser console (F12) and look for:
```
WebSocket connected
device:registered event received
```

**Refresh Device Manager**:
- Click refresh button
- Or reload page (F5)

### Upload Fails

**Driver Issues (Windows)**:
- Install CP210x USB driver: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

**Hold BOOT Button**:
- Press and hold **BOOT** button
- Click **Upload** in Arduino IDE
- Release **BOOT** after "Connecting..." appears

**Wrong Port Selected**:
- Check **Tools → Port**
- Try different COM ports

**Permission Issues (Mac/Linux)**:
```bash
sudo chmod 666 /dev/ttyUSB0
```

### Display Not Working (Heltec)

The Heltec library should handle display automatically.

**If display is blank**:
- Check Serial Monitor - device might still be working
- Press RESET button
- Re-upload firmware

### Display Not Working (T-Watch)

**TFT_eSPI Configuration**:
The T-Watch might need custom TFT_eSPI settings. If display doesn't work:

1. Find TFT_eSPI library folder:
   - Windows: `Documents\Arduino\libraries\TFT_eSPI`
   - Mac: `~/Documents/Arduino/libraries/TFT_eSPI`

2. Edit `User_Setup_Select.h`:
   - Comment out default setup
   - Uncomment T-Watch S3 setup (if available)

3. Or use T-Watch example code from LilyGO GitHub

---

## 10. Next Steps

Once both devices are connected and visible in Device Manager:

### Assign Heltec Button to Location

1. Go to **Locations** page
2. Select a location (e.g., "Guest Cabin 1")
3. Click **Edit**
4. In device assignment, select your Heltec device
5. Click **Save**

### Assign T-Watch to Crew Member

1. Go to **Crew** page
2. Select a crew member (e.g., "Emily Chen")
3. Click **Edit**
4. In device assignment, select your T-Watch
5. Click **Save**

### Test Full Workflow (Later)

After full firmware is implemented:
1. Press button on Heltec
2. Service request created
3. T-Watch receives notification
4. Crew member accepts on T-Watch
5. Heltec shows "Accepted"

---

## Reference: Heltec Pinout

### OLED Display
- **SDA**: GPIO17
- **SCL**: GPIO18
- **RST**: GPIO21

### LoRa Module (Not used now)
- **NSS**: GPIO8
- **SCK**: GPIO9
- **MOSI**: GPIO10
- **MISO**: GPIO11
- **RST**: GPIO12
- **BUSY**: GPIO13
- **DIO1**: GPIO14

### Available GPIO for Buttons (Future)
- **GPIO1-7**: ADC capable, good for buttons
- **GPIO40-46**: Additional GPIO
- **GPIO0**: USER_SW (already has button on board!)

---

## Quick Command Reference

### Arduino IDE Shortcuts
- **Ctrl+U** (Win/Linux) or **Cmd+U** (Mac): Upload
- **Ctrl+R** (Win/Linux) or **Cmd+R** (Mac): Verify (compile)
- **Ctrl+Shift+M** (Win/Linux) or **Cmd+Shift+M** (Mac): Serial Monitor

### Serial Monitor Commands
- **Baud Rate**: 115200
- **Line Ending**: Both NL & CR

### Docker Commands
```bash
# Check containers
docker ps

# Check backend logs
docker logs obedio-backend-1 -f

# Check mosquitto logs
docker logs mosquitto -f

# Restart backend
docker restart obedio-backend-1
```

---

## Support

If you encounter issues:

1. Check Serial Monitor output (most errors show here)
2. Check backend logs for MQTT messages
3. Check Device Manager page for device status
4. Verify WiFi and MQTT broker are accessible
5. Try pressing RESET button on device

---

**Ready to program your devices!** 🚀

Start with Heltec, then T-Watch. Both should appear in Device Manager within 10-15 seconds of powering on.

---

*Last Updated: October 24, 2025*
*OBEDIO Development Team*
