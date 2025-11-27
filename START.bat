@echo off
title OBEDIO - Start System
color 0B
cls

echo.
echo ========================================
echo    OBEDIO - STARTING SYSTEM
echo ========================================
echo.

REM Get the directory where this script is located
cd /d "%~dp0"

echo [1/3] Starting Mosquitto MQTT Broker...
echo.

REM First check if container exists and start it
docker start obedio-mosquitto >nul 2>&1
if %errorlevel%==0 (
    echo    Starting existing container...
    timeout /t 2 /nobreak >nul
    docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}" | findstr "Up" >nul
    if %errorlevel%==0 (
        echo    ✓ Mosquitto Docker container started!
    ) else (
        echo    Container failed, recreating...
        docker rm -f obedio-mosquitto >nul 2>&1
        docker run -d -p 1883:1883 -p 9001:9001 --name obedio-mosquitto eclipse-mosquitto:2 >nul 2>&1
        timeout /t 3 /nobreak >nul
        echo    ✓ Mosquitto container recreated!
    )
) else (
    echo    Container not found, creating new one...
    docker rm -f obedio-mosquitto >nul 2>&1
    docker run -d -p 1883:1883 -p 9001:9001 --name obedio-mosquitto eclipse-mosquitto:2 >nul 2>&1
    timeout /t 3 /nobreak >nul
    docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}" | findstr "Up" >nul
    if %errorlevel%==0 (
        echo    ✓ Mosquitto container created and started!
    ) else (
        echo    ✗ Failed to start Mosquitto! Make sure Docker Desktop is running.
    )
)

REM Verify MQTT is listening
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":1883" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo    ✓ MQTT broker listening on port 1883!
) else (
    echo    ⚠ MQTT port 1883 not ready yet, waiting...
    timeout /t 3 /nobreak >nul
)
echo.

echo [2/3] Starting Backend Server...
echo.
start "OBEDIO Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
echo    Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Verify backend is listening (check both ports)
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo    ✓ Backend started on port 8080!
) else (
    echo    ⚠ Backend still initializing...
    timeout /t 3 /nobreak >nul
)
echo.

echo [3/3] Starting Frontend Server...
echo.
start "OBEDIO Frontend" cmd /k "cd /d "%~dp0" && npm run dev"
echo    Waiting for frontend to start...
timeout /t 5 /nobreak >nul

REM Verify frontend is listening
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo    ✓ Frontend started on port 5173!
) else (
    echo    ⚠ Frontend still initializing...
)
echo.

echo ========================================
echo    STARTUP COMPLETE!
echo ========================================
echo.
echo MQTT Broker:  mqtt://localhost:1883
echo Backend API:  https://localhost:8080
echo Frontend:     http://localhost:5173
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo Press any key to close...
pause >nul
