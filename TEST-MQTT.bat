@echo off
title OBEDIO - MQTT Test
color 0B
cls

echo.
echo ========================================
echo    OBEDIO MQTT SYSTEM TEST
echo ========================================
echo.
echo This will send a REAL MQTT message to test the system.
echo.

REM Check if Mosquitto is running
echo [1/3] Checking MQTT Broker status...
docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}" | findstr "Up" >nul
if %errorlevel%==0 (
    echo      ✓ MQTT Broker is running
) else (
    echo      ✗ MQTT Broker is NOT running!
    echo.
    echo      Please run START-OBEDIO.bat first.
    echo.
    pause
    exit
)

echo.
echo [2/3] Sending TEST message via MQTT...
echo.
echo      Topic: obedio/button/BTN-TEST-001/press
echo      Payload: ESP32 button press simulation
echo.

REM Send a test message using docker exec into the mosquitto container
docker exec obedio-mosquitto mosquitto_pub -h localhost -p 1883 -t "obedio/button/BTN-TEST-001/press" -m "{\"deviceId\":\"BTN-TEST-001\",\"locationId\":\"test-location-123\",\"guestId\":\"test-guest-456\",\"pressType\":\"single\",\"button\":\"main\",\"timestamp\":\"2025-10-24T15:30:00Z\",\"battery\":95,\"rssi\":-42,\"firmwareVersion\":\"2.1.0-test\",\"sequenceNumber\":12345}"

if %errorlevel%==0 (
    echo      ✓ Message sent successfully!
) else (
    echo      ✗ Failed to send message!
)

echo.
echo [3/3] Verification Instructions
echo ========================================
echo.
echo NOW CHECK THESE:
echo.
echo 1. MQTT Monitor (http://localhost:8888)
echo    - Should show "1 message received"
echo    - Should show device "BTN-TEST-001"
echo    - Click to see the full payload
echo.
echo 2. Backend Console Window
echo    - Should show: 📥 MQTT message
echo    - Should show: 🔘 Button press from BTN-TEST-001
echo.
echo 3. Service Requests Page
echo    - Should show a new pending request
echo.
echo ========================================
echo.
echo Opening MQTT Monitor in browser...
timeout /t 2 /nobreak >nul

REM Open MQTT Monitor
start http://localhost:8888

echo.
echo ========================================
echo   TEST RESULTS
echo ========================================
echo.
echo If you SEE the message in MQTT Monitor:
echo   ✓ MQTT Broker is WORKING
echo   ✓ MQTT Monitor is WORKING
echo   ✓ Backend is RECEIVING messages
echo   → Problem is: Frontend widget not publishing
echo.
echo If you DON'T SEE the message:
echo   ✗ MQTT Broker or Monitor has a problem
echo   ✗ Check backend console for errors
echo.
echo.
pause
