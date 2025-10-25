# OBEDIO Hardware Specifications

**Version**: 1.0
**Date**: October 24, 2025
**Status**: Production Ready

---

## Overview

This document specifies the hardware requirements for the OBEDIO yacht crew management system:

1. **ESP32 Smart Button** - Guest cabin button for calling crew services
2. **ESP32 Smart Watch** - Crew wearable for receiving service requests

Both devices connect via WiFi to the Mosquitto MQTT broker running on the Obedio server.

---

## 🔘 ESP32 Smart Button

### Purpose
- Installed in guest cabins
- Main button + 4 auxiliary buttons (configurable functions)
- Wireless communication via WiFi/MQTT
- Battery or USB powered
- Wall-mounted or freestanding

### Core Components

| Component | Specification | Quantity | Est. Price |
|-----------|--------------|----------|------------|
| **ESP32 DevKit** | ESP32-WROOM-32, 4MB Flash, WiFi + BT | 1 | $5-10 |
| **Buttons** | Tactile push buttons, 12mm | 5 | $0.50 each |
| **LED** | RGB LED or single color | 1-5 | $0.20 each |
| **Battery** | 18650 Li-Ion 3.7V 2200mAh + holder | 1 | $5 |
| **Charging Module** | TP4056 Li-Ion charger | 1 | $1 |
| **Voltage Regulator** | AMS1117-3.3V or buck converter | 1 | $1 |
| **PCB** | Custom PCB or prototyping board | 1 | $2-5 |
| **Enclosure** | 3D printed or ABS plastic box | 1 | $3-10 |
| **Connectors** | Micro USB or USB-C | 1 | $1 |

**Total Cost per Unit**: ~$20-35 USD

### Pin Connections

```
ESP32 GPIO Mapping:
├─ GPIO 21  → Main Button (CENTER)
├─ GPIO 19  → AUX1 Button (TOP-LEFT - DND)
├─ GPIO 18  → AUX2 Button (TOP-RIGHT - Lights)
├─ GPIO 5   → AUX3 Button (BOTTOM-LEFT - Food)
├─ GPIO 17  → AUX4 Button (BOTTOM-RIGHT - Drinks)
├─ GPIO 2   → Status LED
├─ GPIO 34  → Battery voltage monitor (ADC)
└─ GND + 3.3V for all buttons (with pull-up resistors)
```

### Power Consumption

| Mode | Current Draw | Battery Life (2200mAh) |
|------|-------------|------------------------|
| Active (WiFi on) | ~160mA | ~13 hours |
| Deep Sleep | ~10μA | ~25 years |
| Button Press | ~200mA (peak) | N/A |

**Recommended**: Deep sleep between button presses → ~6 months battery life with normal usage

### Physical Specifications

- **Size**: 100mm × 80mm × 30mm (compact wall-mount design)
- **Weight**: ~100g with battery
- **Mounting**: Wall-mount bracket or adhesive backing
- **Water Resistance**: IP54 (splash resistant) - optional
- **Operating Temperature**: 0°C to 50°C

---

## ⌚ ESP32 Smart Watch

### Purpose
- Worn by crew members
- Receive service request notifications
- Display location, guest, request type
- Vibration/audio alerts
- Acknowledge and complete requests
- Battery powered (rechargeable)

### Core Components

| Component | Specification | Quantity | Est. Price |
|-----------|--------------|----------|------------|
| **ESP32 DevKit** | ESP32-WROOM-32, 4MB Flash, WiFi + BT | 1 | $5-10 |
| **OLED Display** | SSD1306 128x64 I2C OLED | 1 | $4-6 |
| **Vibration Motor** | Coin vibration motor 3V | 1 | $2 |
| **Buttons** | Tactile push buttons 6mm | 3 | $0.30 each |
| **Battery** | 500mAh Li-Po 3.7V | 1 | $5 |
| **Charging Module** | TP4056 Li-Po charger | 1 | $1 |
| **Voltage Regulator** | AMS1117-3.3V | 1 | $1 |
| **Buzzer** (optional) | Piezo buzzer 3V | 1 | $1 |
| **RTC Module** (optional) | DS3231 Real-Time Clock | 1 | $2 |
| **Watch Strap** | Silicone or nylon strap | 1 | $3-5 |
| **Enclosure** | 3D printed watch case | 1 | $5-10 |

**Total Cost per Unit**: ~$30-45 USD

### Pin Connections

```
ESP32 GPIO Mapping:
├─ GPIO 25  → Button UP (scroll up)
├─ GPIO 26  → Button SELECT (acknowledge/action)
├─ GPIO 27  → Button DOWN (scroll down)
├─ GPIO 14  → Vibration motor (via transistor)
├─ GPIO 2   → Status LED
├─ GPIO 34  → Battery voltage monitor (ADC)
├─ GPIO 22  → I2C SCL (OLED display)
├─ GPIO 21  → I2C SDA (OLED display)
└─ GPIO 15  → Buzzer (optional)
```

### Display Specifications

- **Type**: OLED (Organic LED)
- **Size**: 0.96" diagonal
- **Resolution**: 128×64 pixels
- **Interface**: I2C
- **Color**: Monochrome (white/blue on black)
- **Brightness**: Adjustable
- **Viewing Angle**: >160°

### Power Consumption

| Mode | Current Draw | Battery Life (500mAh) |
|------|-------------|----------------------|
| Active (WiFi + Display) | ~120mA | ~4 hours |
| Idle (Display off) | ~40mA | ~12 hours |
| Deep Sleep | ~10μA | ~5 years |

**Recommended**: Display timeout after 30 seconds → ~8-10 hours battery life per charge

### Physical Specifications

- **Case Size**: 50mm × 40mm × 15mm
- **Display Size**: 30mm × 16mm (0.96" OLED)
- **Weight**: ~60g with battery
- **Strap**: Adjustable 20mm wide
- **Water Resistance**: IP54 (splash resistant) - optional
- **Operating Temperature**: 0°C to 50°C

---

## 🛠️ Development Hardware (Recommended)

### For Prototyping

| Item | Purpose | Price |
|------|---------|-------|
| ESP32 DevKit V1 | Main development board | $8 |
| Breadboard | Prototyping | $3 |
| Jumper Wires | Connections | $2 |
| USB Cable | Programming | $2 |
| Multimeter | Testing | $10 |
| Soldering Iron | Assembly | $20 |

### For Production

| Item | Purpose | Price (MOQ 100) |
|------|---------|-----------------|
| Custom PCB | Professional assembly | $2-5 per board |
| SMD Components | Smaller form factor | ~$10 per unit |
| 3D Printed Cases | Custom enclosures | $3-5 per unit |
| Assembly Service | Professional assembly | $5-10 per unit |

---

## 📊 Bill of Materials (BOM)

### ESP32 Smart Button (1 unit)

| Qty | Part Number | Description | Unit Price | Total |
|-----|-------------|-------------|------------|-------|
| 1 | ESP32-WROOM-32 | ESP32 module | $6.00 | $6.00 |
| 5 | B3F-1000 | Tactile switches | $0.50 | $2.50 |
| 1 | WS2812B | RGB LED | $0.30 | $0.30 |
| 1 | 18650-2200 | Li-Ion battery | $4.00 | $4.00 |
| 1 | TP4056 | Charging module | $0.80 | $0.80 |
| 1 | AMS1117-3.3 | Voltage regulator | $0.50 | $0.50 |
| 1 | PCB-BTN-001 | Custom PCB | $3.00 | $3.00 |
| 1 | CASE-BTN-001 | 3D printed case | $5.00 | $5.00 |
| 1 | USB-MICRO | Micro USB connector | $0.50 | $0.50 |
| | | **TOTAL PER BUTTON** | | **$22.60** |

### ESP32 Smart Watch (1 unit)

| Qty | Part Number | Description | Unit Price | Total |
|-----|-------------|-------------|------------|-------|
| 1 | ESP32-WROOM-32 | ESP32 module | $6.00 | $6.00 |
| 1 | SSD1306-096 | OLED display 0.96" | $4.50 | $4.50 |
| 1 | VM1203 | Coin vibration motor | $1.50 | $1.50 |
| 3 | B3F-1000 | Tactile switches 6mm | $0.30 | $0.90 |
| 1 | LIPO-500 | Li-Po battery 500mAh | $4.00 | $4.00 |
| 1 | TP4056 | Charging module | $0.80 | $0.80 |
| 1 | AMS1117-3.3 | Voltage regulator | $0.50 | $0.50 |
| 1 | PCB-WATCH-001 | Custom PCB | $3.00 | $3.00 |
| 1 | CASE-WATCH-001 | 3D printed case | $6.00 | $6.00 |
| 1 | STRAP-20MM | Silicone strap | $3.00 | $3.00 |
| | | **TOTAL PER WATCH** | | **$30.20** |

### Complete System (10 buttons + 5 watches)

| Item | Qty | Unit Price | Total |
|------|-----|------------|-------|
| Smart Buttons | 10 | $22.60 | $226.00 |
| Smart Watches | 5 | $30.20 | $151.00 |
| **TOTAL SYSTEM** | | | **$377.00** |

---

## 🔌 Power Supply Options

### ESP32 Smart Button

**Option 1: Battery Powered (Recommended)**
- 18650 Li-Ion battery (2200mAh)
- TP4056 charging module
- Micro USB charging port
- Deep sleep mode for power saving
- Battery life: 3-6 months with normal use

**Option 2: USB Powered**
- 5V USB power supply
- No battery required
- Always-on operation
- Suitable for permanent installations

**Option 3: Hybrid (Best)**
- Battery + USB charging
- Works during power outage
- Automatic switchover

### ESP32 Smart Watch

**Battery Powered (Only Option)**
- 500mAh Li-Po battery
- TP4056 charging module
- Micro USB or magnetic charging
- Display timeout for power saving
- Battery life: 8-10 hours active use
- Charge time: ~2 hours

---

## 📡 Network Requirements

### WiFi Specifications

| Parameter | Requirement |
|-----------|-------------|
| Standard | IEEE 802.11 b/g/n |
| Frequency | 2.4 GHz |
| Security | WPA2-PSK (AES) |
| Range | 50-100m indoor |
| RSSI | Minimum -75 dBm |

### MQTT Broker

| Parameter | Value |
|-----------|-------|
| Protocol | MQTT 3.1.1 |
| Port | 1883 (TCP) |
| Port | 9001 (WebSocket) |
| QoS | 0, 1 supported |
| Authentication | Optional (username/password) |
| TLS | Optional (recommended for production) |

---

## 🏭 Manufacturing Considerations

### Prototype Phase (1-10 units)

**Method**: Hand assembly
- Use ESP32 DevKit boards
- Breadboard/prototyping
- 3D printed enclosures
- Manual soldering
- **Cost**: $25-40 per unit
- **Lead Time**: 1-2 weeks

### Small Production (10-100 units)

**Method**: Semi-automated
- Custom PCB (SMD components)
- 3D printed or injection molded cases
- Professional assembly
- **Cost**: $15-25 per unit
- **Lead Time**: 3-4 weeks

### Mass Production (100+ units)

**Method**: Fully automated
- SMT assembly line
- Injection molded cases
- Bulk component pricing
- **Cost**: $10-15 per unit
- **Lead Time**: 6-8 weeks
- **MOQ**: 100 units

---

## 🧪 Testing Equipment

### Required for Development

- **Multimeter** - Voltage/current testing ($10-20)
- **Logic Analyzer** - I2C/SPI debugging ($15-30)
- **WiFi Analyzer** - Signal strength testing (free app)
- **MQTT Client** - Testing MQTT messages (free software)
- **Battery Tester** - Battery capacity testing ($10-20)

### Optional but Recommended

- **Oscilloscope** - Signal analysis ($50-200)
- **Power Supply** - Benchtop PSU ($30-100)
- **Hot Air Station** - SMD rework ($40-80)
- **3D Printer** - Case prototyping ($200-500)

---

## 📦 Supplier Recommendations

### Electronic Components

- **AliExpress** - Cheap, slow shipping (2-4 weeks)
- **Amazon** - Fast shipping, higher prices
- **Mouser/Digikey** - Professional, reliable, fast
- **LCSC** - Good prices, component variety

### ESP32 Boards

- **Espressif** - Original manufacturer
- **AI-Thinker** - Popular clone
- **DOIT** - DevKit V1 boards
- **Wemos** - LOLIN D32 boards

### PCB Manufacturing

- **JLCPCB** - $2 for 5 PCBs, SMT assembly available
- **PCBWay** - Higher quality, better service
- **OSH Park** - US-based, purple PCBs
- **Seeed Studio** - Fusion PCB service

### 3D Printing

- **Shapeways** - Professional 3D printing service
- **Treatstock** - Compare local 3D printing services
- **Local Makerspaces** - Community 3D printers
- **Own Printer** - Creality Ender 3 (~$200)

---

## 🔒 Certifications (Optional)

For commercial deployment, consider:

- **CE** - European Conformity (mandatory in EU)
- **FCC** - Federal Communications Commission (mandatory in US)
- **IP Rating** - Water/dust resistance (IP54 recommended)
- **RoHS** - Restriction of Hazardous Substances
- **UL** - Safety certification (optional)

**Cost**: $5,000 - $20,000 for full certification
**Time**: 3-6 months

---

## 📝 Next Steps

1. **Prototype Phase**:
   - Order components from BOM
   - Assemble 2-3 test units
   - Flash firmware
   - Test in real environment

2. **Testing Phase**:
   - Range testing (WiFi coverage)
   - Battery life testing
   - Button durability testing
   - User experience testing

3. **Production Phase**:
   - Finalize PCB design
   - Order custom PCBs
   - Design injection mold for cases
   - Set up assembly line

4. **Deployment Phase**:
   - Install buttons in cabins
   - Distribute watches to crew
   - Configure WiFi settings
   - Train crew on usage

---

**Estimated Timeline**:
- Prototypes: 2 weeks
- Testing: 2 weeks
- Production: 4-6 weeks
- Deployment: 1 week

**Total**: ~9-11 weeks from start to deployment

**Budget**:
- Prototypes (5 units): $150-200
- Testing equipment: $100-200
- Production (50 units): $1,000-1,500
- **Total**: ~$1,250-1,900

---

*Document Version: 1.0*
*Last Updated: October 24, 2025*
*Author: OBEDIO Development Team*
