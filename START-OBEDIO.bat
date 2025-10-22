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

REM Function to check if port is in use and get PID
set BACKEND_PID=
set FRONTEND_PID=

REM Check port 8080
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    set BACKEND_PID=%%a
)

REM Check port 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    set FRONTEND_PID=%%a
)

REM Handle existing processes
if defined BACKEND_PID (
    echo WARNING: Port 8080 already in use (PID: %BACKEND_PID%)
    echo Stopping existing backend process...
    taskkill /F /PID %BACKEND_PID% >nul 2>&1
    timeout /t 2 /nobreak >nul
)

if defined FRONTEND_PID (
    echo WARNING: Port 5173 already in use (PID: %FRONTEND_PID%)
    echo Stopping existing frontend process...
    taskkill /F /PID %FRONTEND_PID% >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM Kill any remaining OBEDIO processes by window title
taskkill /FI "WINDOWTITLE eq OBEDIO Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq OBEDIO Frontend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator:  OBEDIO Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator:  OBEDIO Frontend*" /F >nul 2>&1

echo.
echo Starting servers...
echo.

REM Start Backend Server
echo [1/2] Starting Backend API Server (Port 8080)...
start "OBEDIO Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Wait for backend to initialize
echo      Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

REM Verify backend started
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo      ✓ Backend started successfully!
) else (
    echo      ✗ Backend failed to start!
    echo      Check the backend window for errors.
)

REM Start Frontend Server
echo.
echo [2/2] Starting Frontend Web Server (Port 5173)...
start "OBEDIO Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

REM Wait for frontend to start
echo      Waiting for frontend to start...
timeout /t 8 /nobreak >nul

REM Verify frontend started
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo      ✓ Frontend started successfully!
) else (
    echo      ✗ Frontend failed to start!
    echo      Check the frontend window for errors.
)

echo.
echo ========================================
echo    STARTUP COMPLETE!
echo ========================================
echo.
echo Backend API:  http://localhost:8080/api
echo Frontend App: http://localhost:5173
echo Database:     PostgreSQL (active)
echo.
echo Opening web app in browser...
timeout /t 2 /nobreak >nul

REM Open browser
start http://localhost:5173

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
echo.
pause
