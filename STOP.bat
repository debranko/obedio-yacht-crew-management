@echo off
title OBEDIO - Stop System
color 0C
cls

echo.
echo ========================================
echo    OBEDIO - STOPPING SYSTEM
echo ========================================
echo.

echo [1/2] Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel%==0 (
    echo    ✓ Node.js processes stopped
) else (
    echo    ℹ No Node.js processes running
)
timeout /t 2 /nobreak >nul

echo [2/2] Stopping Mosquitto MQTT Broker...
docker stop obedio-mosquitto >nul 2>&1
if %errorlevel%==0 (
    echo    ✓ MQTT broker stopped
) else (
    echo    ℹ MQTT broker not running
)
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo    SHUTDOWN COMPLETE
echo ========================================
echo.

REM Verify ports are free
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo Backend:  ⚠ Still running
) else (
    echo Backend:  ✓ OFFLINE
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo Frontend: ⚠ Still running
) else (
    echo Frontend: ✓ OFFLINE
)

docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}" | findstr "Up" >nul
if %errorlevel%==0 (
    echo MQTT:     ⚠ Still running
) else (
    echo MQTT:     ✓ OFFLINE
)

echo.
echo Use START.bat to restart.
echo.
pause
