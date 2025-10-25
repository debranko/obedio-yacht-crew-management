# OBEDIO ESP32 Hardware

**Production-Ready Firmware for ESP32 Smart Buttons & Watches**

---

## 🎯 Overview

This directory contains everything needed to build, program, and deploy the OBEDIO hardware devices:

1. **ESP32 Smart Button** - Guest cabin button for calling crew services
2. **ESP32 Smart Watch** - Crew wearable for receiving service notifications

Both devices communicate via WiFi/MQTT to the Obedio backend server.

---

## 📂 Directory Structure

```
hardware/
├── esp32-button/
│   └── esp32-button.ino          # Button firmware (Arduino)
├── esp32-watch/
│   └── esp32-watch.ino           # Watch firmware (Arduino)
├── HARDWARE-SPECIFICATIONS.md    # Component specs & BOM
├── SETUP-GUIDE.md               # Programming & configuration guide
├── TESTING-GUIDE.md             # Comprehensive testing procedures
└── README.md                    # This file
```

---

## 🚀 Quick Start

### 1. Read the Documentation

**Start here** → [SETUP-GUIDE.md](SETUP-GUIDE.md)

This guide covers:
- Software installation (Arduino IDE, drivers, libraries)
- Hardware assembly (wiring diagrams)
- Firmware configuration
- Upload procedures
- Troubleshooting

### 2. Order Components

**Reference** → [HARDWARE-SPECIFICATIONS.md](HARDWARE-SPECIFICATIONS.md)

Bill of Materials (BOM) included for:
- **ESP32 Smart Button**: ~$23 per unit
- **ESP32 Smart Watch**: ~$30 per unit

### 3. Program & Test

**Follow** → [TESTING-GUIDE.md](TESTING-GUIDE.md)

Comprehensive testing procedures:
- Power-on test
- WiFi connectivity test
- MQTT connection test
- Button/display functionality
- Battery life test
- Range test
- Integration test with backend

---

## 🔘 ESP32 Smart Button

### Features

- ✅ 5 buttons: 1 main + 4 auxiliary (configurable)
- ✅ Press detection: single, double, long press
- ✅ WiFi connectivity (2.4GHz)
- ✅ MQTT protocol for communication
- ✅ Battery powered (3-6 months) with USB charging
- ✅ LED feedback
- ✅ Low power deep sleep mode
- ✅ Automatic reconnection

### Button Functions (Default)

- **MAIN** (Center) - Call crew / Butler
- **AUX1** (Top-Left) - Do Not Disturb
- **AUX2** (Top-Right) - Lights control
- **AUX3** (Bottom-Left) - Food/dining request
- **AUX4** (Bottom-Right) - Drinks request

### Technical Specs

| Specification | Value |
|---------------|-------|
| Microcontroller | ESP32-WROOM-32 |
| WiFi | 802.11 b/g/n (2.4GHz) |
| Power | 18650 Li-Ion (2200mAh) or USB |
| Battery Life | 3-6 months (with deep sleep) |
| Range | 20-50m (indoor) |
| Buttons | 5× tactile switches |
| LED | 1× RGB or single color |
| Dimensions | 100mm × 80mm × 30mm |
| Weight | ~100g with battery |

### MQTT Message Format

```json
{
  "deviceId": "BTN-D4:CA:6E:11:22:33",
  "locationId": "e5f7a281-3a54-4e89-b723-7c2e9f8d1234",
  "guestId": null,
  "pressType": "single",
  "button": "main",
  "timestamp": "2025-10-24T14:30:00.000Z",
  "battery": 95,
  "rssi": -45,
  "firmwareVersion": "1.0.0",
  "sequenceNumber": 1234
}
```

**Topic**: `obedio/button/{deviceId}/press`

---

## ⌚ ESP32 Smart Watch

### Features

- ✅ 0.96" OLED display (128×64)
- ✅ Real-time service request notifications
- ✅ Vibration alerts (priority-based patterns)
- ✅ 3-button navigation interface
- ✅ Battery status indicator
- ✅ WiFi connectivity
- ✅ MQTT subscription
- ✅ Acknowledge/complete requests
- ✅ NTP time synchronization
- ✅ Crew status management

### Display Modes

1. **Home Screen** - Time, crew name, status, pending requests
2. **Requests List** - Scrollable list of service requests
3. **Request Detail** - Full request information
4. **Settings** - Crew status toggle, WiFi info

### Alert Patterns

- **Normal**: 1 long vibration (500ms)
- **Urgent**: 3 long vibrations with pauses
- **Emergency**: 5 rapid vibrations (continuous)

### Technical Specs

| Specification | Value |
|---------------|-------|
| Microcontroller | ESP32-WROOM-32 |
| Display | SSD1306 OLED 128×64 (I2C) |
| WiFi | 802.11 b/g/n (2.4GHz) |
| Power | 500mAh Li-Po |
| Battery Life | 8-10 hours (active use) |
| Vibration | Coin motor 3V |
| Buttons | 3× tactile switches |
| Dimensions | 50mm × 40mm × 15mm |
| Weight | ~60g with battery |

### MQTT Topics

**Subscribe** (receive notifications):
```
obedio/crew/{crewId}/notification
```

**Publish** (acknowledge requests):
```
obedio/crew/{crewId}/acknowledge
```

**Publish** (status updates):
```
obedio/crew/{crewId}/status
```

---

## 🛠️ Development Setup

### Required Hardware

**Minimum**:
- ESP32 DevKit board ($8)
- Breadboard ($3)
- Jumper wires ($2)
- USB cable ($2)
- Buttons/LEDs ($2)
- **Total**: ~$17

**Recommended**:
- Multimeter ($10)
- Soldering iron ($20)
- 3D printer access ($200 or use service)

### Required Software

**All Free**:
- Arduino IDE 2.x
- ESP32 board support
- PubSubClient library (MQTT)
- ArduinoJson library
- Adafruit GFX + SSD1306 libraries (watch only)

### Installation Time

- Software setup: 30 minutes
- Hardware assembly (breadboard): 1 hour
- Programming & testing: 1 hour
- **Total**: ~2.5 hours for first device

---

## 📡 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Guest Cabin                        │
│                                                      │
│  ┌──────────────┐                                   │
│  │ ESP32 Button │                                   │
│  │  [5 buttons] │                                   │
│  └──────┬───────┘                                   │
│         │ WiFi (2.4GHz)                             │
└─────────┼───────────────────────────────────────────┘
          │
          │
┌─────────▼──────────────────────────────────────────┐
│            Yacht WiFi Network                       │
│                                                     │
│  ┌───────────────────────────────────┐             │
│  │   Obedio Server (Docker)          │             │
│  │                                   │             │
│  │  ┌─────────────────────────────┐ │             │
│  │  │ Mosquitto MQTT Broker       │ │             │
│  │  │ Port: 1883 (TCP)            │ │             │
│  │  │ Port: 9001 (WebSocket)      │ │             │
│  │  └───────────┬─────────────────┘ │             │
│  │              │                    │             │
│  │  ┌───────────▼─────────────────┐ │             │
│  │  │ Backend Service (Node.js)   │ │             │
│  │  │ - MQTT Client               │ │             │
│  │  │ - PostgreSQL Database       │ │             │
│  │  │ - WebSocket Server          │ │             │
│  │  └─────────────────────────────┘ │             │
│  └───────────────────────────────────┘             │
│                                                     │
└─────────┬───────────────────────────────────────────┘
          │
          │ WiFi (2.4GHz)
          │
┌─────────▼───────────────────────────────────────────┐
│                 Crew Member                          │
│                                                      │
│  ┌──────────────┐                                   │
│  │  ESP32 Watch │                                   │
│  │  [OLED]      │                                   │
│  │  [Vibration] │                                   │
│  └──────────────┘                                   │
└──────────────────────────────────────────────────────┘
```

### Message Flow

1. **Guest presses button** → ESP32 Button
2. **MQTT publish** → `obedio/button/{deviceId}/press`
3. **Mosquitto broker** → Routes message
4. **Backend receives** → Creates service request in database
5. **Backend publishes** → `obedio/crew/{crewId}/notification`
6. **ESP32 Watch receives** → Displays + vibrates
7. **Crew acknowledges** → ESP32 Watch publishes acknowledgment
8. **Backend updates** → Service request status

---

## 🔒 Security Considerations

### Production Deployment

**WiFi**:
- ✅ Use WPA2-PSK (AES) encryption
- ✅ Strong password (min 12 characters)
- ✅ Separate guest network (optional)
- ✅ Hidden SSID (optional)

**MQTT**:
- ✅ Enable authentication (username/password)
- ✅ Use TLS/SSL encryption (port 8883)
- ✅ Restrict topic access (ACLs)
- ✅ Change default passwords

**Physical**:
- ✅ Secure button mounting (tamper-resistant)
- ✅ Enclosure sealing (prevent opening)
- ✅ Serial port disabled (prevent firmware dump)

### Firmware Protection

**Enable in production**:
```cpp
// Disable serial debug output
#define DEBUG_MODE false

// Enable flash encryption
// Set in Arduino IDE: Tools → Flash Encryption → Enabled

// Enable secure boot
// Requires ESP32 with eFuse support
```

---

## 🔋 Power Management

### ESP32 Button

**Always-On Mode** (USB powered):
- Current: ~160mA
- Battery life: N/A (USB powered)
- Use case: Permanent installations

**Deep Sleep Mode** (Battery powered):
- Active: ~160mA during button press
- Deep sleep: ~10µA between presses
- Battery life: 3-6 months (with 10 presses/day)

**Implementation**:
```cpp
// After publishing MQTT message:
esp_sleep_enable_timer_wakeup(60 * 1000000); // 60 seconds
esp_deep_sleep_start();
```

### ESP32 Watch

**Active Mode**:
- Display on + WiFi: ~120mA
- Battery life: ~4 hours

**Idle Mode**:
- Display off + WiFi: ~40mA
- Battery life: ~12 hours

**Optimization**:
- Display timeout: 30 seconds
- WiFi sleep mode: Light sleep
- CPU frequency: 80MHz (lower from 240MHz)

---

## 📊 Performance Metrics

### Expected Performance

| Metric | Target | Typical |
|--------|--------|---------|
| **Button Response Time** | < 100ms | ~50ms |
| **MQTT Publish Time** | < 200ms | ~100ms |
| **WiFi Connection Time** | < 10s | ~5s |
| **MQTT Connection Time** | < 5s | ~2s |
| **Button → Watch Latency** | < 2s | ~1s |
| **WiFi Range (open)** | > 20m | 30-50m |
| **WiFi Range (indoor)** | > 10m | 15-25m |
| **Button Battery Life** | > 90 days | 3-6 months |
| **Watch Battery Life** | > 8 hours | 8-10 hours |

### Reliability Targets

- **Uptime**: 99.9% (< 9 hours downtime/year)
- **Message Delivery**: 99.5% success rate
- **False Triggers**: < 0.1% (1 per 1000 presses)
- **Reconnection Time**: < 30 seconds

---

## 🧪 Testing Checklist

Before deployment, complete:

- [ ] **Lab Tests**
  - [ ] Power-on test
  - [ ] WiFi connectivity test
  - [ ] MQTT connection test
  - [ ] Button functionality test
  - [ ] Display test (watch)
  - [ ] Vibration test (watch)
  - [ ] Battery test
  - [ ] Range test
  - [ ] Load test
  - [ ] Integration test

- [ ] **On-Site Tests**
  - [ ] Installation test
  - [ ] Signal strength test
  - [ ] End-to-end workflow test
  - [ ] User acceptance test
  - [ ] 24-hour stability test

**Full testing guide**: [TESTING-GUIDE.md](TESTING-GUIDE.md)

---

## 🐛 Troubleshooting

### Quick Fixes

**Device won't boot**:
1. Check power supply (5V, min 500mA)
2. Try different USB cable
3. Press BOOT button during upload
4. Reflash firmware

**WiFi won't connect**:
1. Verify SSID/password
2. Check WiFi is 2.4GHz (not 5GHz)
3. Move closer to router (RSSI > -75 dBm)
4. Restart router

**MQTT won't connect**:
1. Check broker IP address
2. Verify broker is running: `docker ps`
3. Test with telnet: `telnet <IP> 1883`
4. Check firewall settings

**Buttons not responding**:
1. Check wiring (button → GND)
2. Test with multimeter (continuity)
3. Try different GPIO pin
4. Check GND connection

**Display not working**:
1. Check I2C wiring (SCL/SDA)
2. Try address 0x3C or 0x3D
3. Run I2C scanner
4. Check 3.3V power (not 5V!)

**Full troubleshooting guide**: [SETUP-GUIDE.md#troubleshooting](SETUP-GUIDE.md#troubleshooting)

---

## 📦 Production Deployment

### Prototype Phase (1-10 units)

**Cost**: $25-40 per unit
**Lead Time**: 1-2 weeks
**Method**: Hand assembly

**Steps**:
1. Order components from BOM
2. Assemble on breadboard/proto board
3. Flash firmware
4. Test in lab
5. Deploy on yacht

### Small Production (10-100 units)

**Cost**: $15-25 per unit
**Lead Time**: 3-4 weeks
**Method**: Custom PCB + semi-automated

**Steps**:
1. Design custom PCB
2. Order PCBs (JLCPCB, PCBWay)
3. SMT assembly (optional)
4. 3D print cases
5. Quality control testing
6. Deployment

### Mass Production (100+ units)

**Cost**: $10-15 per unit
**Lead Time**: 6-8 weeks
**MOQ**: 100 units
**Method**: Fully automated assembly

**Considerations**:
- Injection molded cases
- CE/FCC certification
- Bulk component pricing
- Professional assembly line
- Quality assurance processes

---

## 📄 License & Support

### License

This firmware is part of the OBEDIO Yacht Crew Management System.
- **Internal Use**: Free for OBEDIO deployment
- **Commercial Use**: Contact for licensing

### Support

- **Documentation**: See markdown files in this directory
- **Issues**: Report hardware issues in main repository
- **Email**: support@obedio.com (if applicable)

### Contributing

Hardware improvements welcome:
- PCB design optimizations
- Power consumption improvements
- Additional features
- Bug fixes

Submit pull requests to main repository.

---

## 🎯 Next Steps

### For First-Time Users

1. **Read** → [SETUP-GUIDE.md](SETUP-GUIDE.md)
2. **Order** → Components from [HARDWARE-SPECIFICATIONS.md](HARDWARE-SPECIFICATIONS.md)
3. **Build** → Assemble on breadboard
4. **Program** → Flash firmware from `esp32-button/` or `esp32-watch/`
5. **Test** → Follow [TESTING-GUIDE.md](TESTING-GUIDE.md)
6. **Deploy** → Install on yacht

### For Production

1. **Prototype** → Build 2-3 test units
2. **Test** → Complete all tests in testing guide
3. **Design** → Create custom PCB
4. **Manufacture** → Order PCBs and components
5. **Assemble** → SMT or hand assembly
6. **QC** → Quality control testing
7. **Deploy** → Install on yacht(s)

---

## 📞 FAQ

**Q: Can I use a different ESP32 board?**
A: Yes, any ESP32 with WiFi will work. Adjust pin numbers in firmware.

**Q: Can I use a different display for the watch?**
A: Yes, but you'll need to modify the firmware. SSD1306 is recommended.

**Q: How do I change button functions?**
A: Edit the firmware and change button mappings. Or use web app configuration (future feature).

**Q: Can I add more buttons?**
A: Yes, ESP32 has plenty of GPIO pins. Update firmware accordingly.

**Q: How do I update firmware Over-The-Air (OTA)?**
A: OTA support can be added. See ESP32 OTA documentation.

**Q: What's the maximum range?**
A: Typically 20-50m indoors. Depends on walls, interference, WiFi router.

**Q: Can I use 5GHz WiFi?**
A: No, ESP32 only supports 2.4GHz WiFi.

**Q: How do I backup firmware?**
A: Use `esptool.py read_flash` to backup, or save .ino file.

---

**Ready to build? Start with [SETUP-GUIDE.md](SETUP-GUIDE.md)!** 🚀

---

*Last Updated: October 24, 2025*
*OBEDIO Development Team*
*Version: 1.0*
