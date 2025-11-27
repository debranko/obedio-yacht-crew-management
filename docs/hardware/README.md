# Hardware Documentation

ESP32-S3 Smart Button documentation and firmware.

---

## Schematics

- [ESP32S3_Smart_Button_v3.0.pdf](ESP32S3_Smart_Button_v3.0.pdf) - PCB schematic

---

## Firmware

Firmware source code is in `/hardware/` folder at project root:

- `METSTRADE-FINAL/WITH-AUXILIARY-BUTTONS/` - Production firmware
- `t-circle-s3-voice-test/` - Voice test firmware

See [METSTRADE-FIRMWARE-README.md](METSTRADE-FIRMWARE-README.md) for firmware details.

---

## Features

- Main button (GPA7) - Service call / Voice recording
- Auxiliary buttons (GPA6-3) - DND, Lights, Food, Extra
- Shake detection - Emergency call
- LED ring (16x WS2812B)
- Speaker (MAX98357A) - Confirmation sounds
- WiFi + MQTT integration

---

## Hardware Specs

- MCU: ESP32-S3
- GPIO Expander: MCP23017
- Accelerometer: LIS3DH
- Microphone: MSM261S4030H0R (I2S)
- Speaker: MAX98357A (I2S)
