# ESP32 Build Script
Write-Host "Sourcing ESP-IDF environment..." -ForegroundColor Cyan
. C:\Espressif\frameworks\esp-idf-v5.3.1\export.ps1

Write-Host "Navigating to project..." -ForegroundColor Cyan
Set-Location "c:\Users\debra\OneDrive\Desktop\OBEDIO Final\hardware\obedio-esp-idf"

Write-Host "Building firmware..." -ForegroundColor Green
idf.py build

Write-Host "Build complete!" -ForegroundColor Green
