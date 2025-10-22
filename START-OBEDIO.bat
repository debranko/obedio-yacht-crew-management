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
echo Starting servers...
echo.

REM Check if ports are already in use
echo Checking ports...
netstat -ano | findstr ":3001" >nul
if %errorlevel%==0 (
    echo.
    echo ========================================
    echo    WARNING: Port 3001 already in use!
    echo ========================================
    echo.
    echo Backend server is already running or was not properly stopped.
    echo.
    echo Do you want to:
    echo  [1] Stop existing processes and restart
    echo  [2] Exit (manually run STOP-OBEDIO.bat first)
    echo.
    choice /c 12 /n /m "Choose option (1 or 2): "
    
    if errorlevel 2 (
        echo.
        echo Exiting... Please run STOP-OBEDIO.bat first.
        pause
        exit /b
    )
    
    if errorlevel 1 (
        echo.
        echo Stopping existing processes...
        taskkill /F /IM node.exe >nul 2>&1
        timeout /t 2 /nobreak >nul
        echo Processes stopped. Continuing with startup...
        echo.
    )
)

netstat -ano | findstr ":5173" >nul
if %errorlevel%==0 (
    echo.
    echo ========================================
    echo    WARNING: Port 5173 already in use!
    echo ========================================
    echo.
    echo Frontend server is already running or was not properly stopped.
    echo.
    echo Stopping existing frontend processes...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
    echo Processes stopped. Continuing with startup...
    echo.
)

REM Start Backend Server
echo [1/2] Starting Backend API Server (Port 3001)...
start "OBEDIO Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Wait for backend to initialize
echo      Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Start Frontend Server
echo [2/2] Starting Frontend Web Server (Port 5173)...
start "OBEDIO Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

REM Wait for frontend to start
echo      Waiting for frontend to start...
timeout /t 8 /nobreak >nul

echo.
echo ========================================
echo    SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend API:  http://localhost:3001/api
echo Frontend App: http://localhost:5173
echo.
echo Database: PostgreSQL (running)
echo Celebrity Guests: Leonardo DiCaprio, George Clooney, Ryan Reynolds...
echo.
echo Opening web app in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:5173

echo.
echo ========================================
echo   SYSTEM READY FOR DEMO!
echo ========================================
echo.
echo Login: admin / password
echo.
echo IMPORTANT: 
echo - Do NOT close Backend and Frontend windows!
echo - Use STOP-OBEDIO.bat to shut down properly
echo.
pause
