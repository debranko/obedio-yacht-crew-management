@echo off
title OBEDIO - System Restart
color 0E
cls

echo.
echo ========================================
echo    OBEDIO SYSTEM RESTART
echo ========================================
echo.

echo [Phase 1/2] Stopping current services...
echo.

REM Stop all Node.js processes forcefully
echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Stop Mosquitto Docker container
echo Stopping MQTT Broker...
docker stop obedio-mosquitto >nul 2>&1
timeout /t 2 /nobreak >nul

echo Services stopped successfully!
echo.

echo [Phase 2/2] Starting services...
echo.

REM Start Mosquitto MQTT Broker
echo [1/3] Starting Mosquitto MQTT Broker...

REM Try to start existing container first
docker start obedio-mosquitto >nul 2>&1
if %errorlevel%==0 (
    echo      Starting existing MQTT container...
    timeout /t 3 /nobreak >nul
    docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}" | findstr "Up" >nul
    if %errorlevel%==0 (
        echo      ✓ MQTT broker started successfully!
    ) else (
        echo      ✗ Failed to start MQTT container!
        echo      Trying to create new container...
        docker rm -f obedio-mosquitto >nul 2>&1
        docker run -d -p 1883:1883 -p 9001:9001 -v "%~dp0mosquitto:/mosquitto" --name obedio-mosquitto eclipse-mosquitto:2 >nul 2>&1
        if %errorlevel%==0 (
            echo      ✓ MQTT broker created and started!
        ) else (
            echo      ✗ Failed to create MQTT container!
        )
    )
) else (
    echo      Container not found, creating new one...
    docker rm -f obedio-mosquitto >nul 2>&1
    docker run -d -p 1883:1883 -p 9001:9001 -v "%~dp0mosquitto:/mosquitto" --name obedio-mosquitto eclipse-mosquitto:2 >nul 2>&1
    if %errorlevel%==0 (
        echo      ✓ MQTT broker created and started!
    ) else (
        echo      ✗ Failed to create MQTT container!
    )
)

timeout /t 3 /nobreak >nul

REM Start Backend Server
echo.
echo [2/3] Starting Backend API Server (Port 8080)...
start "OBEDIO Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Wait for backend to initialize
echo      Waiting for backend to initialize...
timeout /t 8 /nobreak >nul

REM Verify backend started
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo      ✓ Backend started successfully!
) else (
    echo      ⚠ Backend startup incomplete (may still be initializing)
)

REM Start Frontend Server
echo.
echo [3/3] Starting Frontend Web Server (Port 5173)...
start "OBEDIO Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

REM Wait for frontend to start
echo      Waiting for frontend to start...
timeout /t 10 /nobreak >nul

REM Verify frontend started
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo      ✓ Frontend started successfully!
) else (
    echo      ⚠ Frontend startup incomplete (may still be initializing)
)

echo.
echo ========================================
echo    RESTART COMPLETE!
echo ========================================
echo.
echo MQTT Broker:  mqtt://10.10.0.207:1883 (WebSocket: ws://10.10.0.207:9001)
echo Backend API:  http://10.10.0.207:8080/api
echo MQTT Monitor: http://10.10.0.207:8888
echo Frontend App: http://10.10.0.207:5173
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser
start http://10.10.0.207:5173

echo.
echo ========================================
echo   SYSTEM RESTARTED!
echo ========================================
echo.
echo Login: admin / admin123
echo.
echo IMPORTANT:
echo - Keep the command windows open
echo - Use STOP-OBEDIO.bat to shut down
echo - If MQTT error appears, wait 10 seconds and refresh browser
echo.
pause
