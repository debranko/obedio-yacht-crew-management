@echo off
echo ========================================
echo ESP32 Build and Flash Tool
echo ========================================
echo.

REM Start ESP-IDF PowerShell with build and flash commands
powershell.exe -ExecutionPolicy Bypass -NoExit -Command ^
"& { ^
    Write-Host 'Initializing ESP-IDF environment...' -ForegroundColor Cyan; ^
    . 'C:\Espressif\frameworks\esp-idf-v5.3.1\export.ps1'; ^
    Write-Host 'Building firmware...' -ForegroundColor Green; ^
    Set-Location 'c:\Users\debra\OneDrive\Desktop\OBEDIO Final\hardware\obedio-esp-idf'; ^
    idf.py build; ^
    if ($LASTEXITCODE -eq 0) { ^
        Write-Host 'Build successful! Flashing to COM23...' -ForegroundColor Green; ^
        idf.py -p COM23 flash monitor ^
    } else { ^
        Write-Host 'Build failed! Check errors above.' -ForegroundColor Red ^
    } ^
}"
