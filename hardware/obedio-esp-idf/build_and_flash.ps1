# ESP32 Build and Flash Script
# Source ESP-IDF environment
. C:\Espressif\frameworks\esp-idf-v5.3.1\export.ps1

# Navigate to project directory
Set-Location "c:\Users\debra\OneDrive\Desktop\OBEDIO Final\hardware\obedio-esp-idf"

# Build firmware
Write-Host "Building firmware..." -ForegroundColor Green
idf.py build

# Flash to device on COM23
Write-Host "Flashing to COM23..." -ForegroundColor Green
idf.py -p COM23 flash monitor
