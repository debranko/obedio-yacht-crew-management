# ESP32-S3 Smart Button v3.0 - GPIO Pin Mapping

**Hardware Version:** ESP32-S3 Custom PCB v1.0
**MCU:** ESP32-S3R8 (8MB PSRAM)
**Schematic Reference:** ESP32S3_Smart_Button_v3.0.pdf
**Last Updated:** 2024-11-17

---

## Table of Contents
1. [Overview](#overview)
2. [I2C Bus Configuration](#i2c-bus-configuration)
3. [SPI Bus Configuration](#spi-bus-configuration)
4. [I2S Audio - Microphone](#i2s-audio---microphone)
5. [I2S Audio - Speaker Amplifier](#i2s-audio---speaker-amplifier)
6. [LED Control](#led-control)
7. [Touch Sensor](#touch-sensor)
8. [LoRa Module (SX1262)](#lora-module-sx1262)
9. [Buttons (Direct ESP32 GPIOs)](#buttons-direct-esp32-gpios)
10. [Power Management](#power-management)
11. [USB Interface](#usb-interface)
12. [Critical Pin Notes](#critical-pin-notes)

---

## Overview

This document provides the complete GPIO pin mapping for the ESP32-S3 Smart Button v3.0 hardware. The design uses:
- **ESP32-S3R8** main processor (U2)
- **MCP23017T** I2C GPIO expander (U6) for 6 buttons
- **LIS3DHTR** I2C accelerometer (U5)
- **MSM261S4030H0R** I2S MEMS microphone (U11)
- **MAX98357A** I2S audio amplifier (U1)
- **SX1262** LoRa transceiver (U9)
- **GD25Q128ESIG** 16MB SPI flash (U3)
- **MCP9808T** I2C temperature sensor (U17)
- **TTP223-BA6-TD** capacitive touch controller (U12)
- **16x WS2812B** NeoPixel LED ring

---

## I2C Bus Configuration

### I2C Master (I2C_NUM_0)
- **SDA:** GPIO3
- **SCL:** GPIO2
- **Frequency:** 100 kHz

### I2C Device Addresses

| Device | Part Number | I2C Address | Function |
|--------|-------------|-------------|----------|
| U6 | MCP23017T-E/ML | 0x20 | GPIO Expander (6 buttons) |
| U5 | LIS3DHTR | 0x19 | 3-axis Accelerometer |
| U17 | MCP9808T-E/MC | 0x18* | Temperature Sensor |

**Note:** MCP9808T address depends on A0, A1, A2 pin configuration. Default is typically 0x18.

### I2C Connected Signals

| Signal | ESP32 GPIO | Device | Description |
|--------|-----------|--------|-------------|
| SDA | GPIO3 | Multiple | I2C Data Line |
| SCL | GPIO2 | Multiple | I2C Clock Line |
| MCP_INT | TBD** | U6 (MCP23017) | GPIO expander interrupt |
| INT1 | TBD** | U5 (LIS3DHTR) | Accelerometer interrupt |
| ALERT | TBD** | U17 (MCP9808T) | Temperature alert |

**TBD = To Be Determined from schematic trace

---

## SPI Bus Configuration

### Dedicated SPI Flash (Internal Bus)

The ESP32-S3R8 has dedicated pins for SPI flash that **cannot be used for other purposes**:

| Pin Function | ESP32-S3 Pin Name | Connected To |
|--------------|-------------------|--------------|
| MOSI | SPID | U3 (GD25Q128ESIG) pin SI |
| MISO | SPIQ | U3 (GD25Q128ESIG) pin SO |
| SCLK | SPICLK | U3 (GD25Q128ESIG) pin SCLK |
| CS | SPICS0 | U3 (GD25Q128ESIG) pin CS |
| WP | SPIWP | U3 (GD25Q128ESIG) pin WP |
| HD | SPIHD | U3 (GD25Q128ESIG) pin HOLD |
| VDD_SPI | VDD_SPI | U3 VCC (3.3V) |

**⚠️ CRITICAL:** These pins are hardwired to the external flash and are NOT available as GPIO.

### General Purpose SPI (LoRa Module)

The LoRa module uses a separate SPI bus on general-purpose GPIOs:

| Signal | ESP32 GPIO | SX1262 Pin | Description |
|--------|-----------|------------|-------------|
| NSS | TBD | NSS (pin 19) | SPI Chip Select |
| SCK | TBD | SCK (pin 18) | SPI Clock |
| MOSI | TBD | MOSI (pin 17) | SPI MOSI |
| MISO | TBD | MISO (pin 16) | SPI MISO |

**Note:** These GPIOs need to be traced from schematic. Typically uses HSPI or custom GPIO assignment.

---

## I2S Audio - Microphone

### I2S Port 0 (I2S_NUM_0) - MSM261S4030H0R MEMS Microphone (U11)

| Function | ESP32 GPIO | MSM261S4030H0R Pin | Signal Name |
|----------|-----------|-------------------|-------------|
| Bit Clock (SCK) | **GPIO33** | SCK (pin 7) | I2S_MIC_BCK_IO |
| Word Select (WS) | **GPIO38** | WS (pin 2) | I2S_MIC_WS_IO |
| Serial Data (SD) | **GPIO34** | SD (pin 8) | I2S_MIC_DATA_IO |
| Chip Enable | Via transistor Q2 | CHIPEN (pin 3) | Controlled by firmware |
| L/R Select | Tied to GND/VDD | L/R (pin 5) | Channel selection |

### Configuration Details
- **Sample Rate:** 16 kHz (configurable)
- **Bit Depth:** 32-bit (24-bit data in 32-bit frame)
- **Mode:** I2S Master RX
- **Channel:** Mono (LEFT channel)

---

## I2S Audio - Speaker Amplifier

### I2S Port 1 (I2S_NUM_1) - MAX98357A Amplifier (U1)

| Function | ESP32 GPIO | MAX98357A Pin | Signal Name |
|----------|-----------|---------------|-------------|
| Bit Clock (BCLK) | **GPIO10** | BCLK (pin 16) | I2S_SPK_BCK_IO |
| Word Select (LRCLK) | **GPIO18** | LRCLK (pin 14) | I2S_SPK_WS_IO |
| Serial Data (DIN) | **GPIO11** | DIN (pin 1) | I2S_SPK_DATA_IO |
| Shutdown/Mute | **GPIO14** | SD_MODE (pin 4) | I2S_SPK_ENABLE_IO |

### Configuration Details
- **Sample Rate:** 16 kHz (configurable)
- **Bit Depth:** 16-bit
- **Mode:** I2S Master TX
- **Channel:** Mono (LEFT channel)
- **Control:** GPIO14 HIGH = Enabled, LOW = Shutdown

---

## LED Control

### WS2812B NeoPixel LED Ring (16 LEDs)

| Function | ESP32 GPIO | Description |
|----------|-----------|-------------|
| Data Line | **GPIO17** | Serial data to first LED in chain |

### Configuration
- **LED Count:** 16 LEDs
- **Type:** WS2812B (GRB color order, 800kHz)
- **Default Brightness:** 200/255
- **Default Color:** Red (255, 0, 0)
- **Control Method:** RMT (Remote Control) peripheral

### Status LED

| Function | ESP32 GPIO | Component | Description |
|----------|-----------|-----------|-------------|
| Red LED | **GPIO43*** | D1 | Status indicator |

**Note:** GPIO43 needs verification from schematic trace.

---

## Touch Sensor

### Capacitive Touch via TTP223-BA6-TD (U12)

| Function | ESP32 GPIO | TTP223 Pin | Description |
|----------|-----------|------------|-------------|
| Touch Input | **GPIO1** | OUT (pin 1) | Touch detection output |

### Configuration
- **Type:** ESP32-S3 built-in touch sensor (TOUCH_PAD_NUM1)
- **Threshold:** 80% of baseline
- **Debounce:** 50ms
- **Double-touch window:** 500ms

---

## LoRa Module (SX1262)

### SPI Connection (See SPI Bus section above)

### Control and Status Pins

| Signal | ESP32 GPIO | SX1262 Pin | Description |
|--------|-----------|------------|-------------|
| NRESET | TBD | NRESET (pin 15) | Module reset (active low) |
| BUSY | TBD | BUSY (pin 14) | Busy status indicator |
| DIO1 | TBD | DIO1 (pin 13) | Interrupt/GPIO |
| DIO2 | N/C | DIO2 (pin 12) | Not connected |
| DIO3 | N/C | DIO3 (pin 6) | Not connected |

### RF Antenna Switching

| Signal | ESP32 GPIO | Component | Description |
|--------|-----------|-----------|-------------|
| ANT_SEL | TBD | U7 (PE4259-63) | RF switch control |
| RF_ON_OFF | TBD | U7 CTRL | LoRa power control |

### Crystal/Clock

| Signal | SX1262 Pin | Component | Description |
|--------|------------|-----------|-------------|
| XTA | Pin 3 | Y2 (32MHz) | Crystal A |
| XTB | Pin 4 | Y2 (32MHz) | Crystal B |

**Note:** LoRa GPIO assignments need to be traced from schematic or firmware configuration.

---

## Buttons (Direct ESP32 GPIOs)

### Boot and Reset Buttons

| Button | ESP32 GPIO | Component | Function |
|--------|-----------|-----------|----------|
| BOOT | **GPIO0** | SW1 (SKTDLDE010) | Boot mode selection |
| RESET | CHIP_PU (EN) | SW2 (SKTDLDE010) | Hard reset |

### MCP23017 GPIO Expander Buttons (U6)

The 6 main buttons are connected to the MCP23017 I2C GPIO expander at address 0x20:

| Button | MCP23017 Pin | GPA Pin | Function | MQTT ID |
|--------|--------------|---------|----------|---------|
| T1 | GPA7 | Pin 7 | Main button / Voice recording | "main" |
| T2 | GPA6 | Pin 6 | Call service | "aux1" |
| T3 | GPA5 | Pin 5 | Lights control | "aux2" |
| T4 | GPA4 | Pin 4 | Prepare food | "aux3" |
| T5 | GPA3 | Pin 3 | Bring drinks | "aux4" |
| T6 | GPA0 | Pin 0 | DND toggle | "aux5" |

### Button Configuration
- **Pull-up:** Internal pull-ups enabled on MCP23017
- **Active State:** LOW (pressed = 0)
- **Debounce:** 50ms
- **Long Press Threshold:** 700ms (configurable)
- **Double Click Window:** 500ms

**Special Function:**
- **T6 (GPA0):** Hold for 10 seconds during boot to trigger factory reset

---

## Power Management

### Battery and Charging

| Signal | ESP32 GPIO | Component | Description |
|--------|-----------|-----------|-------------|
| BAT_M | TBD | Voltage divider | Battery voltage monitor |
| CHARG_DET | TBD | U14 (TP4056) | Charge status detection |

### Wireless Charging

| Component | Description |
|-----------|-------------|
| U15 (BQ51013BRHLR) | Qi wireless charging receiver |

### Power Control

| Signal | ESP32 GPIO | Component | Description |
|--------|-----------|-----------|-------------|
| EN | TBD | Power enable | System power control |
| S_ON_OFF | TBD | Transistor Q1/Q7 | Peripheral power switching |

---

## USB Interface

### USB Type-C (CN2)

| Signal | ESP32 GPIO | USB Pin | Description |
|--------|-----------|---------|-------------|
| D+ | **GPIO20*** | DP1, DP2 | USB Data + |
| D- | **GPIO19*** | DN1, DN2 | USB Data - |
| VBUS | Sense circuit | VBUS | USB 5V detection |

**Note:** ESP32-S3 has built-in USB PHY. GPIO numbers need verification from schematic.

---

## Accelerometer Configuration

### LIS3DHTR (U5) - I2C Address 0x19

| Signal | ESP32 GPIO | Description |
|--------|-----------|-------------|
| INT1 | TBD | Motion/shake interrupt |
| INT2 | Not connected | Secondary interrupt |

### Configuration
- **Range:** ±2G
- **Sample Rate:** 50 Hz
- **Shake Threshold:** 8.0G (configurable)
- **Debounce:** 2000ms between shake events

---

## Temperature Sensor

### MCP9808T (U17) - I2C Temperature Sensor

| Signal | ESP32 GPIO | Description |
|--------|-----------|-------------|
| ALERT | TBD | Temperature alert output |

---

## Critical Pin Notes

### ⚠️ Pins That Must Not Be Changed

1. **GPIO0 (BOOT)** - Bootloader entry. Must be HIGH during normal boot.
2. **CHIP_PU (RESET)** - Must be pulled HIGH for operation.
3. **SPICS0, SPIQ, SPID, SPICLK, SPIWP, SPIHD** - Dedicated flash pins, cannot be reassigned.
4. **VDD_SPI** - Flash power supply, must be 3.3V.

### 🔧 Strapping Pins (ESP32-S3)

The following pins have bootstrap requirements:
- **GPIO0:** Boot mode (HIGH = normal, LOW = download mode)
- **GPIO45:** VDD_SPI voltage (internal strapping)
- **GPIO46:** ROM messages enable (internal strapping)

**During boot:**
- Avoid floating states on GPIO0
- Other GPIOs should avoid conflicting states

### 📌 Pin Conflicts to Avoid

- **GPIO33, GPIO34, GPIO38** are used for I2S microphone - do not use for other purposes
- **GPIO10, GPIO11, GPIO14, GPIO18** are used for I2S speaker - do not use for other purposes
- **GPIO2, GPIO3** are used for I2C - shared by multiple devices
- **GPIO17** controls the LED ring - critical for user feedback

---

## GPIO Allocation Summary

### Confirmed GPIO Assignments

| GPIO | Function | Peripheral | Shared Bus |
|------|----------|------------|------------|
| 0 | BOOT Button | SW1 | - |
| 1 | Touch Sensor | TTP223 (U12) | - |
| 2 | I2C SCL | MCP23017, LIS3DHTR, MCP9808T | I2C Bus |
| 3 | I2C SDA | MCP23017, LIS3DHTR, MCP9808T | I2C Bus |
| 10 | I2S Speaker BCLK | MAX98357A (U1) | I2S Port 1 |
| 11 | I2S Speaker DIN | MAX98357A (U1) | I2S Port 1 |
| 14 | Speaker Enable/Mute | MAX98357A (U1) | - |
| 17 | LED Data | WS2812B Ring | - |
| 18 | I2S Speaker LRCLK | MAX98357A (U1) | I2S Port 1 |
| 19* | USB D- | USB Type-C | - |
| 20* | USB D+ | USB Type-C | - |
| 33 | I2S Mic BCK | MSM261S4030H0R (U11) | I2S Port 0 |
| 34 | I2S Mic SD | MSM261S4030H0R (U11) | I2S Port 0 |
| 38 | I2S Mic WS | MSM261S4030H0R (U11) | I2S Port 0 |
| 43* | Status LED | D1 (Red) | - |
| 45 | Strapping | Internal | - |
| 46 | Strapping | Internal | - |

*Needs verification from schematic trace

### Reserved/Unavailable Pins

| Pin | Function | Cannot Be Used For |
|-----|----------|-------------------|
| SPICS0 | Flash CS | General GPIO |
| SPIQ | Flash MISO | General GPIO |
| SPID | Flash MOSI | General GPIO |
| SPICLK | Flash Clock | General GPIO |
| SPIWP | Flash WP | General GPIO |
| SPIHD | Flash HD | General GPIO |

### Unassigned GPIOs (Available for LoRa and Other Functions)

The following GPIOs are likely available for LoRa SPI and control:
- GPIO4, GPIO5, GPIO6, GPIO7, GPIO8, GPIO9
- GPIO12, GPIO13, GPIO15, GPIO16
- GPIO21, GPIO35, GPIO36, GPIO37
- GPIO39, GPIO40, GPIO41, GPIO42

**Next Steps:**
1. Trace LoRa SPI connections from schematic (NSS, SCK, MOSI, MISO)
2. Trace LoRa control pins (NRESET, BUSY, DIO1)
3. Trace interrupt pins (MCP_INT, INT1, ALERT)
4. Trace power control pins (BAT_M, CHARG_DET, EN, S_ON_OFF)
5. Verify USB GPIO assignments (typically GPIO19/GPIO20)
6. Verify status LED GPIO

---

## Schematic References

### Key Components

| Reference | Part Number | Description | I2C Addr | Notes |
|-----------|-------------|-------------|----------|-------|
| U1 | MAX98357AETE+T | I2S Audio Amplifier | - | Class D, 3W |
| U2 | ESP32-S3R8 | Main MCU | - | 8MB PSRAM |
| U3 | GD25Q128ESIG | 16MB SPI Flash | - | QSPI |
| U5 | LIS3DHTR | 3-Axis Accelerometer | 0x19 | I2C |
| U6 | MCP23017T-E/ML | 16-bit GPIO Expander | 0x20 | I2C |
| U7 | PE4259-63 | RF Switch | - | Antenna switching |
| U9 | SX1262IMLTRT | LoRa Transceiver | - | SPI, 868/915MHz |
| U11 | MSM261S4030H0R | MEMS Microphone | - | I2S |
| U12 | TTP223-BA6-TD | Touch Sensor IC | - | Capacitive |
| U14 | TP4056 | LiPo Charger | - | 580mA max |
| U15 | BQ51013BRHLR | Qi Wireless Charger | - | 1A output |
| U17 | MCP9808T-E/MC | Temperature Sensor | 0x18 | I2C, ±0.5°C |

### Power Supplies

| Rail | Voltage | Source | Consumers |
|------|---------|--------|-----------|
| VIN | 5V | USB/Battery | Input to regulators |
| VDD3V3 | 3.3V | Q5 (XC6220B331MR) | Most digital logic |
| RFVDD3V3 | 3.3V | Q3 (XC6220B331MR) | LoRa module (isolated) |
| VDD_SPI | 3.3V | From ESP32-S3 | SPI Flash only |
| VBAT+ | 3.7V | LiPo Battery | Raw battery voltage |

---

## Firmware Configuration Reference

See [config.h](../../hardware/obedio-esp-idf/main/config.h) for complete firmware configuration including:
- Pin definitions with menuconfig overrides
- I2C/SPI/I2S parameters
- Button timing thresholds
- Audio sample rates
- LED configuration
- MQTT topics
- Task priorities and stack sizes

---

## Document Status

**Complete:** ✅
- I2C bus and device addresses
- I2S microphone (MSM261S4030H0R) complete mapping
- I2S speaker/amplifier complete mapping
- LED control pins
- Touch sensor
- MCP23017 button mapping
- SPI flash (dedicated pins)

**Incomplete:** ⚠️
- LoRa SPI GPIO assignments (NSS, SCK, MOSI, MISO)
- LoRa control GPIOs (NRESET, BUSY, DIO1)
- Interrupt pins (MCP_INT, INT1, ALERT)
- Power management GPIOs (BAT_M, CHARG_DET, EN, S_ON_OFF)
- USB GPIO verification (D+, D-)
- Status LED GPIO verification
- Antenna switch control

**Action Required:**
Trace remaining signals from ESP32-S3R8 (U2) to determine exact GPIO assignments for incomplete items.

---

**Document Created:** 2024-11-17
**Author:** ESP32 Hardware Specialist
**Schematic Version:** ESP32S3_Smart_Button_v3.0.pdf
