# Quick Start Guide - 5 Minutes to First Build

## Step 1: Install PlatformIO (2 minutes)

### Option A: VS Code Extension (Recommended)
1. Download [VS Code](https://code.visualstudio.com/)
2. Install "PlatformIO IDE" extension
3. Restart VS Code

### Option B: Command Line
```bash
pip install platformio
```

---

## Step 2: Open Project (30 seconds)

```bash
cd "C:\Users\debra\OneDrive\Desktop\Luxury Minimal Web App Design\hardware\obedio-custom-pcb-platformio"
code .
```

Or: File → Open Folder in VS Code

---

## Step 3: Configure (1 minute)

### A. Set Your COM Port
Edit `platformio.ini` line 64:
```ini
upload_port = COM3      ; ← Change to your port
monitor_port = COM3     ; ← Change to your port
```

### B. Verify WiFi/MQTT Settings
Check `include/config.h` lines 19-22:
```cpp
#define WIFI_SSID "Obedio"           // ← Your WiFi
#define WIFI_PASSWORD "BrankomeinBruder:)"  // ← Your password
#define MQTT_BROKER "10.10.0.207"   // ← Your MQTT broker
```

---

## Step 4: Build & Upload (1.5 minutes)

### Using VS Code (Easy):
1. Click PlatformIO icon (alien head) in left sidebar
2. Project Tasks → esp32s3 → **Upload**
3. Wait for build + upload (~30 seconds)
4. Project Tasks → esp32s3 → **Monitor**

### Using Command Line:
```bash
# Build + Upload + Monitor (all in one!)
pio run -e esp32s3 -t upload && pio device monitor
```

---

## Step 5: Verify (30 seconds)

Serial monitor should show:

```
========================================
OBEDIO - Custom PCB ESP32-S3 Button
========================================
Firmware: Obedio Custom PCB v1.0.0

✅ I2C bus initialized
✅ NeoPixel initialized
✅ MCP23017 initialized
✅ 6 buttons initialized
✅ LIS3DHTR accelerometer initialized
Device ID: BTN-A1B2C3D4E5F6
✅ WiFi connected!
IP address: 10.10.0.123
✅ MQTT connected!
✅ Device registered

✅ Setup complete! Device ready.
```

**Press a button** → Should see:
```
🔘 Button T1 pressed
📤 Published: main (single)
```

---

## Troubleshooting

### "Upload failed"
**Fix:** Check COM port in `platformio.ini` matches Device Manager

### "Library not found"
**Fix:** PlatformIO will auto-download on first build. Just wait.

### "WiFi won't connect"
**Fix:** Check SSID/password in `include/config.h`

### "MQTT won't connect"
**Fix:**
1. Verify broker IP: `10.10.0.207`
2. Check broker is running: `netstat -an | findstr 1883`

---

## Common Commands

```bash
# Build only (no upload)
pio run

# Upload firmware
pio run -t upload

# Open serial monitor
pio device monitor

# Clean build
pio run -t clean

# Build release (optimized)
pio run -e esp32s3-release -t upload

# Build with debug symbols
pio run -e esp32s3-debug -t upload
```

---

## File Structure Overview

```
obedio-custom-pcb-platformio/
├── platformio.ini       # ← Build configuration
├── include/
│   └── config.h        # ← YOUR SETTINGS HERE
├── src/
│   ├── main.cpp        # Entry point
│   ├── hardware.cpp    # Button/LED/Accelerometer
│   └── network.cpp     # WiFi/MQTT
└── README.md          # Full documentation
```

---

## Next Steps

1. ✅ **Read README.md** for full documentation
2. ✅ **Customize `config.h`** for your needs
3. ✅ **Test all buttons** (T1-T6)
4. ✅ **Test shake detection** (if enabled)
5. ✅ **Monitor MQTT traffic** at http://localhost:8888
6. ✅ **Try release build** for production deployment

---

## Pro Tips

### Tip 1: Multiple Serial Monitors
```bash
# Terminal 1: Upload
pio run -t upload

# Terminal 2: Monitor
pio device monitor
```

### Tip 2: Filter Serial Output
```bash
# Only show errors/warnings
pio device monitor | grep -E "❌|⚠️"
```

### Tip 3: Quick Rebuild
VS Code shortcut: **Ctrl+Alt+B** (build) then **Ctrl+Alt+U** (upload)

### Tip 4: Clean Build When Weird Errors
```bash
pio run -t clean && pio run
```

---

**That's it! You're ready to develop.** 🚀

For detailed documentation, see [README.md](README.md)
