@echo off
title OBEDIO - System Shutdown
color 0C
cls

echo.
echo ========================================
echo    OBEDIO SYSTEM SHUTDOWN
echo ========================================
echo.

echo Stopping services...
echo.

REM Stop all Node.js processes
echo [1/2] Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel%==0 (
    echo      ✓ Node.js processes stopped
) else (
    echo      ℹ No Node.js processes running
)

timeout /t 2 /nobreak >nul

REM Stop Mosquitto Docker container
echo [2/2] Stopping Mosquitto MQTT Broker...
docker stop obedio-mosquitto >nul 2>&1
if %errorlevel%==0 (
    echo      ✓ MQTT broker stopped
) else (
    echo      ℹ MQTT broker not running
)

timeout /t 2 /nobreak >nul

REM Verify ports are free
set BACKEND_STILL_RUNNING=0
set FRONTEND_STILL_RUNNING=0
set MQTT_STILL_RUNNING=0

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 set BACKEND_STILL_RUNNING=1

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 set FRONTEND_STILL_RUNNING=1

docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}" | findstr "Up" >nul
if %errorlevel%==0 set MQTT_STILL_RUNNING=1

echo.
echo ========================================
echo    SHUTDOWN COMPLETE
echo ========================================
echo.

if %BACKEND_STILL_RUNNING%==1 (
    echo Backend API:  ⚠ Still running (Port 8080 in use)
) else (
    echo Backend API:  ✓ OFFLINE
)

if %FRONTEND_STILL_RUNNING%==1 (
    echo Frontend App: ⚠ Still running (Port 5173 in use)
) else (
    echo Frontend App: ✓ OFFLINE
)

if %MQTT_STILL_RUNNING%==1 (
    echo MQTT Broker:  ⚠ Still running
) else (
    echo MQTT Broker:  ✓ OFFLINE
)

echo Database:     PostgreSQL (still running)
echo.
echo System is now offline.
echo Use START-OBEDIO.bat to restart.
echo.
pause
