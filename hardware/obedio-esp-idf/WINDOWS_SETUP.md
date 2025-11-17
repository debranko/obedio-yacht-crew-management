# OBEDIO ESP32-S3 Button - Windows Setup Guide

Complete step-by-step guide for setting up ESP-IDF and flashing firmware on Windows.

## Prerequisites

- Windows 10 or 11
- USB cable to connect ESP32-S3 device
- Administrator access
- ~2GB free disk space for ESP-IDF

## Step 1: Install ESP-IDF (One-Time Setup)

### Download ESP-IDF Installer

1. Download the ESP-IDF **offline installer** for Windows:
   - Go to: https://dl.espressif.com/dl/esp-idf/
   - Download: `esp-idf-tools-setup-offline-5.1.2.exe`
   - Or get the latest v5.1.x version

2. Run the installer (`esp-idf-tools-setup-offline-5.1.2.exe`)

### Installation Steps

1. **Welcome Screen**: Click "Next"

2. **License Agreement**: Accept and click "Next"

3. **Select Components**:
   - ✅ ESP-IDF v5.1.2 (or latest v5.1.x)
   - ✅ ESP-IDF Tools
   - ✅ ESP32-S3 tools
   - Click "Next"

4. **Installation Directory**:
   - Default: `C:\Espressif`
   - You can change this if needed
   - Click "Install"

5. **Wait for Installation**:
   - This will take 10-30 minutes
   - Downloads Python, Git, toolchains, etc.
   - ☕ Get coffee

6. **Finish Installation**:
   - ✅ Check "Run ESP-IDF PowerShell Environment"
   - Click "Finish"

## Step 2: Clone the Project

### Using ESP-IDF PowerShell

When the installer finishes, it opens "ESP-IDF 5.1 PowerShell". Use this terminal for all commands.

```powershell
# Navigate to where you want the project
cd C:\Users\YourName\Documents

# Clone the repository
git clone https://github.com/yourusername/obedio-yacht-crew-management.git

# Navigate to the firmware directory
cd obedio-yacht-crew-management\hardware\obedio-esp-idf
```

## Step 3: Connect ESP32-S3 Device

1. Connect ESP32-S3 to computer via USB
2. Windows should install drivers automatically
3. Check which COM port it's using:
   ```powershell
   # List COM ports
   mode
   ```
   - Look for something like `COM3`, `COM4`, etc.
   - Common ports: COM3, COM4, COM5

## Step 4: Build Firmware

### In ESP-IDF PowerShell:

```powershell
# Make sure you're in the project directory
cd C:\Users\YourName\Documents\obedio-yacht-crew-management\hardware\obedio-esp-idf

# Build the firmware
idf.py build
```

**Expected Output**:
```
...
[100%] Built target app
Project build complete.
```

**Build Time**: 2-5 minutes (first time), ~30 seconds (subsequent builds)

## Step 5: Flash Firmware

### Find Your COM Port

If you don't know your COM port:
```powershell
# Device Manager method
devmgmt.msc
# Look under "Ports (COM & LPT)" for "USB Serial Device (COM#)"
```

### Flash to Device

```powershell
# Replace COM3 with your actual COM port
idf.py -p COM3 flash

# If it fails, try holding BOOT button while flashing:
# 1. Hold BOOT button on ESP32
# 2. Press RESET button
# 3. Release BOOT button
# 4. Run flash command again
```

**Expected Output**:
```
Connecting...
Writing at 0x00010000... (100%)
Wrote 950464 bytes (625384 compressed)
Hash of data verified.
Leaving...
Hard resetting via RTS pin...
Done
```

**Flash Time**: ~10 seconds

## Step 6: Monitor Serial Output

### View Device Logs

```powershell
# Monitor serial output
idf.py -p COM3 monitor

# To exit monitor: Press Ctrl+]
```

**Expected Output**:
```
I (973) MAIN: ==========================================
I (979) MAIN:   Obedio Yacht Crew Management Device
I (985) MAIN:   Firmware Version: v3.0-esp-idf
...
I (3496) MAIN:   Setup complete! Device ready.
```

### Alternative: Simple Python Script

Create `monitor.py`:
```python
import serial
import time

# Change COM3 to your port
ser = serial.Serial('COM3', 115200, timeout=1)
print("Monitoring device... Press Ctrl+C to stop")

try:
    while True:
        if ser.in_waiting > 0:
            data = ser.read(ser.in_waiting)
            print(data.decode('utf-8', errors='replace'), end='')
        time.sleep(0.1)
except KeyboardInterrupt:
    print("\nStopped")
    ser.close()
```

Run it:
```powershell
python monitor.py
```

## Step 7: Test Button Functionality

1. Wait for device to boot (~5 seconds)
2. You should see a **white LED** moving in a circle
3. Press any button:
   - Short press: White flash
   - Long press (>0.5s): Blue flash

### Check MQTT Messages

If you have mosquitto-clients installed:
```powershell
# Subscribe to all button messages
mosquitto_sub -h 10.10.0.10 -t "obedio/button/#" -v
```

## Common Issues

### Issue: "No module named 'serial'"
```powershell
# Install pyserial
pip install pyserial
```

### Issue: "Could not open port COM3"
**Solutions**:
1. Check COM port number in Device Manager
2. Close any other programs using the port (Arduino IDE, PuTTY, etc.)
3. Unplug and replug the USB cable
4. Try a different USB port

### Issue: "espressif not recognized"
**Solution**: Make sure you're using "ESP-IDF 5.1 PowerShell", not regular PowerShell
- Find it in Start Menu: "ESP-IDF 5.1 PowerShell"

### Issue: Build fails with "CMake not found"
**Solution**: Reinstall ESP-IDF tools:
```powershell
C:\Espressif\tools\idf-tools.py install-python-env
```

### Issue: Device keeps resetting
**Solution**: Check serial monitor for errors
```powershell
idf.py -p COM3 monitor
```
- If you see "audio recording started" → Wrong firmware (use latest build)
- If you see "CORRUPT HEAP" → Web server issue (should be fixed)

## Updating Firmware

### Pull Latest Changes
```powershell
cd C:\Users\YourName\Documents\obedio-yacht-crew-management
git pull
cd hardware\obedio-esp-idf
```

### Rebuild and Flash
```powershell
idf.py build
idf.py -p COM3 flash monitor
```

## Quick Reference

### Essential Commands
```powershell
# Build firmware
idf.py build

# Flash to device
idf.py -p COM3 flash

# Monitor serial output
idf.py -p COM3 monitor

# Flash and monitor (one command)
idf.py -p COM3 flash monitor

# Clean build
idf.py fullclean
idf.py build

# Check ESP-IDF version
idf.py --version
```

### File Locations
```
C:\Espressif\                   # ESP-IDF installation
C:\Espressif\frameworks\        # ESP-IDF framework
C:\Espressif\tools\             # Build tools
C:\Users\YourName\.espressif\   # Python environment & tools
```

### Environment Setup (Manual)
If you closed the PowerShell, you can reopen it from Start Menu:
- **Start Menu** → Type "ESP-IDF" → **ESP-IDF 5.1 PowerShell**

Or create a shortcut with:
```powershell
Target: C:\WINDOWS\system32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -NoExit -Command "& 'C:\Espressif\initialize_environment.ps1'"
```

## Serial Terminal Alternatives

If you prefer a GUI:

### 1. PuTTY
- Download: https://www.putty.org/
- Connection type: Serial
- Serial line: COM3 (your port)
- Speed: 115200

### 2. Arduino Serial Monitor
- Tools → Port → COM3
- Baud rate: 115200

### 3. TeraTerm
- Download: https://ttssh2.osdn.jp/
- Setup → Serial Port → COM3, 115200

## Troubleshooting Tips

### Check Device Connection
```powershell
# Windows PowerShell (not ESP-IDF PowerShell)
Get-WmiObject Win32_SerialPort | Select-Object DeviceID,Description
```

### Check Python Version
```powershell
python --version
# Should show Python 3.8 or higher
```

### Reinstall USB Drivers
1. Device Manager
2. Right-click on "USB Serial Device"
3. "Uninstall device"
4. Unplug and replug USB cable
5. Windows will reinstall drivers

### Full Clean Install
If nothing works:
```powershell
# Uninstall ESP-IDF
C:\Espressif\Uninstall.exe

# Delete folders
Remove-Item -Recurse -Force C:\Espressif
Remove-Item -Recurse -Force C:\Users\YourName\.espressif

# Reinstall from Step 1
```

## Next Steps

1. ✅ Firmware flashed
2. ✅ Device is sending button presses
3. ✅ White LED running light visible
4. Check frontend to see button events
5. Test all 6 buttons

## Support

If you encounter issues not covered here:
1. Check `WORKING_STATUS.md` for current device status
2. Check GitHub issues
3. Contact support with serial monitor output

---

**ESP-IDF Version**: v5.1.2
**Tested on**: Windows 10, Windows 11
**Device**: ESP32-S3-WROOM-1 (8MB Flash, 2MB PSRAM)
