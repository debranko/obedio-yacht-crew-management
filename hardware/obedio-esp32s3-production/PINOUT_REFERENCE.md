# ESP32-S3 Custom PCB - Complete Pinout Reference

Based on schematic: `ESP32S3_Smart_Button_v3.0.pdf`

---

## 📋 Quick Reference Table

| GPIO | Function | Direction | Component | Notes |
|------|----------|-----------|-----------|-------|
| GPIO2 | I2C_SCL | Output | MCP23017, LIS3DH, MCP9808 | Shared I2C bus |
| GPIO3 | I2C_SDA | Bidir | MCP23017, LIS3DH, MCP9808 | Shared I2C bus |
| GPIO10 | I2S_BCLK (Speaker) | Output | MAX98357A | Audio bit clock |
| GPIO11 | I2S_SD (Speaker) | Output | MAX98357A | Audio data |
| GPIO14 | SPK_SD_MODE | Output | MAX98357A | Speaker shutdown control |
| GPIO17 | LED_RING_DATA | Output | WS2812B RGB LEDs | 16x LED ring |
| GPIO18 | I2S_WS (Speaker) | Output | MAX98357A | Audio word select |
| GPIO33 | I2S_BCLK (Mic) | Output | MSM261S4030H0R | Mic bit clock |
| GPIO34 | I2S_SD (Mic) | Input | MSM261S4030H0R | Mic data input |
| GPIO38 | I2S_WS (Mic) | Output | MSM261S4030H0R | Mic word select |
| GPIO43 | - | - | - | Reserved/Available |
| GPIO44 | - | - | - | Reserved/Available |

---

## 🔌 Detailed Pin Assignments

### I2C Bus (Shared)

| Pin | Signal | Component | Address |
|-----|--------|-----------|---------|
| GPIO2 | SCL | MCP23017 GPIO Expander | 0x20 |
| GPIO2 | SCL | LIS3DH Accelerometer | 0x19 |
| GPIO2 | SCL | MCP9808 Temperature Sensor | 0x18 |
| GPIO3 | SDA | MCP23017 GPIO Expander | 0x20 |
| GPIO3 | SDA | LIS3DH Accelerometer | 0x19 |
| GPIO3 | SDA | MCP9808 Temperature Sensor | 0x18 |

**Configuration:**
- Clock Speed: 100kHz (standard mode)
- Pull-up resistors: 10kΩ to VDD3V3
- Wire.begin(3, 2) in Arduino

---

### SPI Bus (Flash Memory)

| Pin | Signal | Component | Notes |
|-----|--------|-----------|-------|
| VDD_SPI | SPICLK | GD25Q128ESIG | Flash clock (internal) |
| VDD_SPI | SPIQ | GD25Q128ESIG | Flash MISO |
| VDD_SPI | SPID | GD25Q128ESIG | Flash MOSI |
| VDD_SPI | SPICS0 | GD25Q128ESIG | Flash chip select |
| VDD_SPI | SPIHD | GD25Q128ESIG | Flash hold |
| VDD_SPI | SPIWP | GD25Q128ESIG | Flash write protect |

**Note:** Flash SPI uses internal ESP32-S3 pins, not accessible to user code.

---

### SPI Bus (LoRa Module - Optional)

| ESP32 Pin | Signal | Component | Notes |
|-----------|--------|-----------|-------|
| MISO | MISO | SX1262 | LoRa data out |
| MOSI | MOSI | SX1262 | LoRa data in |
| SCK | SCK | SX1262 | LoRa clock |
| NSS | NSS | SX1262 | LoRa chip select |
| DIO1 | DIO1 | SX1262 | LoRa interrupt |
| NRESET | NRESET | SX1262 | LoRa reset |
| BUSY | BUSY | SX1262 | LoRa busy flag |

**Note:** LoRa functionality not implemented in base firmware.

---

### I2S Audio (Microphone)

| GPIO | Signal | Component | Description |
|------|--------|-----------|-------------|
| GPIO33 | MIC_BCLK | MSM261S4030H0R | Bit clock (256 × fs) |
| GPIO38 | MIC_WS | MSM261S4030H0R | Word select (LR clock) |
| GPIO34 | MIC_SD | MSM261S4030H0R | Serial data input |

**Audio Configuration:**
- Sample Rate: 16kHz
- Bits per Sample: 16-bit
- Channels: Mono (L/R pin tied to ground)
- Format: I2S standard

---

### I2S Audio (Speaker/Amplifier)

| GPIO | Signal | Component | Description |
|------|--------|-----------|-------------|
| GPIO10 | SPK_BCLK | MAX98357A | Bit clock |
| GPIO18 | SPK_WS | MAX98357A | Word select (LR clock) |
| GPIO11 | SPK_SD | MAX98357A | Serial data (SDATA) |
| GPIO14 | SPK_SD_MODE | MAX98357A | Shutdown control (active high) |

**Amplifier Configuration:**
- Class D amplifier (3W mono)
- Gain: 9dB (default, configurable via GAIN_SLOT pin)
- SD_MODE: LOW = shutdown, HIGH = enabled

---

### LED Ring (WS2812B)

| GPIO | Signal | Component | Description |
|------|--------|-----------|-------------|
| GPIO17 | LED_DATA | WS2812B Ring | Serial data to 16 LEDs |

**LED Configuration:**
- Type: WS2812B (NeoPixel compatible)
- Count: 16 LEDs in ring formation
- Protocol: 800kHz single-wire
- Color Order: GRB
- Library: Adafruit_NeoPixel

---

### MCP23017 GPIO Expander (Buttons)

**I2C Address:** 0x20

#### Port A (Buttons)

| MCP Pin | GPIO | Button | Function |
|---------|------|--------|----------|
| GPA0 | 0 | T6 | Auxiliary 5 / DND Toggle |
| GPA1 | 1 | T5 | Auxiliary 4 / Bring Drinks |
| GPA2 | 2 | T4 | Auxiliary 3 / Prepare Food |
| GPA3 | 3 | T3 | Auxiliary 2 / Lights Control |
| GPA4 | 4 | T2 | Auxiliary 1 / Call Service |
| GPA5 | 5 | - | Not used |
| GPA6 | 6 | - | Not used |
| GPA7 | 7 | T1 | Main Button / General Service |

**Button Configuration:**
- Active LOW (pull-up enabled)
- Debounce: 50ms
- Long press: 700ms
- Double-click window: 500ms

#### Port B (Unused/Future)

All Port B pins (GPB0-GPB7) are available for future expansion.

---

### LIS3DH Accelerometer

**I2C Address:** 0x19

| MCP Pin | Signal | Description |
|---------|--------|-------------|
| INT1 | GPIO (TBD) | Interrupt 1 (shake detection) |
| INT2 | - | Interrupt 2 (not used) |
| SDA | GPIO3 | I2C data |
| SCL | GPIO2 | I2C clock |

**Accelerometer Configuration:**
- Range: ±2g (default)
- Data rate: 100Hz
- Features: Shake detection, tap detection, orientation

---

### MCP9808 Temperature Sensor

**I2C Address:** 0x18

| Pin | Signal | Description |
|-----|--------|-------------|
| SDA | GPIO3 | I2C data |
| SCL | GPIO2 | I2C clock |
| ALERT | GPIO (TBD) | Temperature alert output |

**Temperature Configuration:**
- Resolution: 0.0625°C (12-bit)
- Range: -40°C to +125°C
- Accuracy: ±0.25°C (typ)

---

### USB Type-C (CN2)

| Pin | Signal | Description |
|-----|--------|-------------|
| D+ | USB_DP | USB data positive |
| D- | USB_DN | USB data negative |
| VBUS | 5V | USB power input |
| GND | GND | Ground |
| CC1/CC2 | 5.1kΩ to GND | USB-C configuration |

**USB Configuration:**
- USB CDC enabled (serial over USB)
- Auto-reset enabled via DTR/RTS

---

### Power Pins

| Signal | Source | Voltage | Description |
|--------|--------|---------|-------------|
| VIN | USB/Battery | 5V | Input voltage |
| VDD3V3 | LDO (Q5) | 3.3V | Main 3.3V rail |
| RFVDD3V3 | LDO (Q3) | 3.3V | RF/LoRa 3.3V rail |
| VDD_SPI | ESP32-S3 | 3.3V | Flash memory power |
| VBAT+ | Battery | 3.7V | Li-ion battery |

---

### Boot/Reset Pins

| Pin | Signal | Component | Function |
|-----|--------|-----------|----------|
| BOOT | SW1 | SKTDLDE010 | Boot mode selection (GPIO0) |
| EN | SW2 | SKTDLDE010 | Chip reset/enable |

**Usage:**
- Hold BOOT + press EN = Enter bootloader mode
- Press EN = Reset device

---

### Touch Sensor (Optional)

| Component | Pin | Signal |
|-----------|-----|--------|
| TTP223 (U12) | OUT | Touch detection output |

**Touch Sensor:**
- Capacitive touch detector
- Active HIGH on touch
- Debounced output
- Can be mapped to any available GPIO

---

### Battery & Charging

| Component | Function | Pins |
|-----------|----------|------|
| TP4056 (U14) | Li-ion charger | BAT, VCC, PROG, TEMP |
| BQ51013B (U15) | Wireless charging RX | AC1, AC2, OUT, FOD |
| TH1 | NTC thermistor | Temperature monitoring |

**Battery Configuration:**
- Type: Single-cell Li-ion (3.7V)
- Charge current: 580mA max
- Charge termination: 4.2V
- Wireless charging: Qi-compatible

---

## 🔧 GPIO Configuration Summary

### Used GPIOs (Committed)

- GPIO2 - I2C SCL
- GPIO3 - I2C SDA
- GPIO10 - Speaker BCLK
- GPIO11 - Speaker SD
- GPIO14 - Speaker SD_MODE
- GPIO17 - LED Ring Data
- GPIO18 - Speaker WS
- GPIO33 - Mic BCLK
- GPIO34 - Mic SD (input only)
- GPIO38 - Mic WS

### Available GPIOs (Free for future use)

- GPIO43 (marked in schematic)
- GPIO44 (marked in schematic)
- GPIO0, GPIO1, GPIO4-GPIO9, GPIO12-GPIO13, GPIO15-GPIO16
- GPIO19-GPIO21, GPIO35-GPIO37, GPIO39-GPIO42, GPIO45-GPIO46

### Strapping Pins (use with caution)

- GPIO0 - Boot mode (pulled high)
- GPIO3 - JTAG (used for I2C SDA)
- GPIO45 - SPI voltage
- GPIO46 - SPI timing

---

## 📊 I2C Device Summary

| Address | Device | Chip | Notes |
|---------|--------|------|-------|
| 0x18 | Temperature | MCP9808 | High-accuracy |
| 0x19 | Accelerometer | LIS3DH | 3-axis |
| 0x20 | GPIO Expander | MCP23017 | 16 I/O pins |

**I2C Bus Scan Output:**
```
Found device at 0x18  (MCP9808 Temperature)
Found device at 0x19  (LIS3DH Accelerometer)
Found device at 0x20  (MCP23017 GPIO Expander)
```

---

## 🎨 LED Ring Patterns

Default LED color codes used in firmware:

| Color | RGB | Meaning |
|-------|-----|---------|
| Off | (0, 0, 0) | Idle |
| White | (255, 255, 255) | Button pressed |
| Green | (0, 255, 0) | Connected / Single click |
| Blue | (0, 0, 255) | Connecting to WiFi |
| Red | (255, 0, 0) | Error / Disconnected |
| Orange | (255, 165, 0) | Reconnecting / Long press |
| Purple | (128, 0, 128) | MQTT connecting |
| Cyan | (0, 255, 255) | Double-click detected |

---

## 🔍 Debugging Tips

### I2C Not Working?

1. Check pull-up resistors (10kΩ to VDD3V3)
2. Verify voltage levels (should be 3.3V)
3. Run I2C scanner sketch
4. Check SDA/SCL not swapped

### Buttons Not Responding?

1. Verify MCP23017 detected (address 0x20)
2. Check pull-up configuration on MCP23017
3. Test with HARDWARE_TEST.ino sketch
4. Measure voltage on button pins (should be 3.3V when not pressed)

### LEDs Not Lighting?

1. Check GPIO17 connection
2. Verify VDD3V3 power to LED ring
3. Try reducing brightness (ledRing.setBrightness(10))
4. Test with simple solid color

### Audio Not Working?

1. Check I2S pin connections
2. Verify SPK_SD_MODE is HIGH to enable amplifier
3. Test microphone with I2S recording example
4. Check speaker connection to amplifier output

---

**Document Version:** 1.0
**Last Updated:** 2025-01-17
**Based on Schematic:** ESP32S3_Smart_Button_v3.0.pdf
