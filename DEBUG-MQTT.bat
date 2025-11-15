@echo off
title OBEDIO - MQTT Debug
color 0E
cls

echo.
echo ========================================
echo    OBEDIO MQTT DEBUG DIAGNOSTIC
echo ========================================
echo.

echo [1] Checking if Mosquitto is installed...
where mosquitto >nul 2>&1
if %errorlevel%==0 (
    echo     ✓ Mosquitto found in PATH
    where mosquitto
) else (
    echo     ✗ Mosquitto NOT found in PATH
    echo     Please install from: https://mosquitto.org/download/
)

echo.
echo [2] Checking if Mosquitto is running...
tasklist | findstr "mosquitto.exe" >nul 2>&1
if %errorlevel%==0 (
    echo     ✓ Mosquitto process is running
    for /f "tokens=2" %%a in ('tasklist ^| findstr "mosquitto.exe"') do echo     PID: %%a
) else (
    echo     ✗ Mosquitto is NOT running
)

echo.
echo [3] Checking MQTT ports...
echo.
echo     Testing port 1883 (MQTT)...
netstat -an | findstr ":1883" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo     ✓ Port 1883 is LISTENING
) else (
    echo     ✗ Port 1883 is NOT listening
)

echo.
echo     Testing port 9001 (WebSocket)...
netstat -an | findstr ":9001" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo     ✓ Port 9001 is LISTENING
) else (
    echo     ✗ Port 9001 is NOT listening
)

echo.
echo [4] Testing MQTT connection with mosquitto_pub...
where mosquitto_pub >nul 2>&1
if %errorlevel%==0 (
    echo     Sending test message...
    mosquitto_pub -h localhost -p 1883 -t "obedio/test" -m "Hello from Debug Script" 2>nul
    if %errorlevel%==0 (
        echo     ✓ Test message sent successfully
    ) else (
        echo     ✗ Failed to send test message
    )
) else (
    echo     ✗ mosquitto_pub not found (part of Mosquitto installation)
)

echo.
echo [5] Checking Docker (alternative)...
docker --version >nul 2>&1
if %errorlevel%==0 (
    echo     ✓ Docker is installed
    docker ps --filter "name=obedio-mosquitto" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul
) else (
    echo     ✗ Docker not available
)

echo.
echo ========================================
echo    TROUBLESHOOTING STEPS:
echo ========================================
echo.
echo If Mosquitto is not running:
echo 1. Install Mosquitto: https://mosquitto.org/download/
echo 2. Run START-OBEDIO.bat again
echo.
echo If ports are not listening:
echo 1. Check Windows Firewall
echo 2. Check if another program uses these ports
echo 3. Run as Administrator
echo.
echo To manually start Mosquitto:
echo   mosquitto -c "%~dp0mosquitto\mosquitto.conf" -v
echo.
pause