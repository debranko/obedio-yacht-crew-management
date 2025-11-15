@echo off
title OBEDIO - Yacht Management System
color 0B
cls

echo.
echo ========================================
echo    OBEDIO YACHT MANAGEMENT SYSTEM
echo ========================================
echo    Luxury Service Management
echo ========================================
echo.
echo Checking system status...
echo.

REM Kill any Node.js processes that might be running
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting services...
echo.

REM Create mosquitto data directory if it doesn't exist
if not exist "%~dp0mosquitto\data" mkdir "%~dp0mosquitto\data"

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
            echo      Please check Docker is running!
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
        echo      Please check Docker is running!
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
    echo      ⚠ Backend startup incomplete (check backend window)
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
    echo      ⚠ Frontend startup incomplete (check frontend window)
)

echo.
echo ========================================
echo    STARTUP COMPLETE!
echo ========================================
echo.
echo MQTT Broker:  mqtt://10.158.214.151:1883 (WebSocket: ws://10.158.214.151:9001)
echo Backend API:  http://10.158.214.151:8080/api
echo MQTT Monitor: http://10.158.214.151:8888
echo Frontend App: http://10.158.214.151:5173
echo Database:     PostgreSQL (active)
echo.
echo Opening web app in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser
start http://10.158.214.151:5173

echo.
echo ========================================
echo   SYSTEM READY!
echo ========================================
echo.
echo Login: admin / admin123
echo.
echo IMPORTANT:
echo - Do NOT close the command windows
echo - Use STOP-OBEDIO.bat to shut down properly
echo - Use RESTART-OBEDIO.bat to restart
echo - If MQTT error appears, wait 10 seconds and refresh browser
echo.
pause
