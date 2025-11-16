#!/bin/bash
# OBEDIO ESP32-S3 Firmware - Setup and Flash Script
# This script installs ESP-IDF (if needed) and builds/flashes the firmware

set -e  # Exit on error

echo "🚀 OBEDIO ESP32-S3 Firmware Builder"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ESP-IDF settings
ESP_IDF_VERSION="v5.1.2"
ESP_IDF_PATH="$HOME/esp/esp-idf"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Step 1: Check/Install ESP-IDF
echo -e "${YELLOW}[1/5] Checking ESP-IDF installation...${NC}"
if [ ! -d "$ESP_IDF_PATH" ]; then
    echo -e "${YELLOW}ESP-IDF not found. Installing...${NC}"
    mkdir -p "$HOME/esp"
    cd "$HOME/esp"

    echo "Cloning ESP-IDF $ESP_IDF_VERSION..."
    git clone --recursive --branch $ESP_IDF_VERSION https://github.com/espressif/esp-idf.git

    cd esp-idf
    echo "Installing ESP-IDF tools..."
    ./install.sh esp32s3

    echo -e "${GREEN}✓ ESP-IDF installed${NC}"
else
    echo -e "${GREEN}✓ ESP-IDF found at $ESP_IDF_PATH${NC}"
fi

# Step 2: Source ESP-IDF environment
echo -e "${YELLOW}[2/5] Setting up ESP-IDF environment...${NC}"
cd "$ESP_IDF_PATH"
source export.sh
echo -e "${GREEN}✓ Environment ready${NC}"

# Step 3: Build firmware
echo -e "${YELLOW}[3/5] Building firmware...${NC}"
cd "$PROJECT_DIR"
idf.py build
echo -e "${GREEN}✓ Firmware built successfully${NC}"

# Step 4: Find connected ESP32-S3 device
echo -e "${YELLOW}[4/5] Looking for ESP32-S3 device...${NC}"
PORT=""

# Common ESP32 USB serial ports on macOS
for p in /dev/cu.usbserial* /dev/cu.SLAB_USBtoUART* /dev/cu.wchusbserial* /dev/tty.usbserial* /dev/cu.usbmodem*; do
    if [ -e "$p" ]; then
        PORT="$p"
        echo -e "${GREEN}✓ Found device at: $PORT${NC}"
        break
    fi
done

if [ -z "$PORT" ]; then
    echo -e "${RED}✗ No ESP32 device found!${NC}"
    echo ""
    echo "Please:"
    echo "1. Connect your ESP32-S3 via USB"
    echo "2. Check the port with: ls /dev/cu.*"
    echo "3. Run: idf.py -p <PORT> flash monitor"
    echo ""
    exit 1
fi

# Step 5: Flash firmware
echo -e "${YELLOW}[5/5] Flashing firmware to $PORT...${NC}"
idf.py -p "$PORT" flash

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Firmware flashed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To monitor serial output, run:"
echo "  idf.py -p $PORT monitor"
echo ""
echo "Or flash and monitor in one command:"
echo "  idf.py -p $PORT flash monitor"
echo ""
echo "Web interface will be available at:"
echo "  http://obedio-{MAC}.local"
echo "  or http://{DEVICE-IP}/"
echo ""
