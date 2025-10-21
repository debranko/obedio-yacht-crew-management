@echo off
title Obedio Yacht Management - Startup
color 0A

echo.
echo ========================================
echo    OBEDIO YACHT MANAGEMENT SYSTEM
echo ========================================
echo.
echo Starting servers...
echo.

REM Start Backend Server
echo [1/2] Starting Backend Server (Port 3001)...
start "Obedio Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

REM Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak >nul

REM Start Frontend Server
echo [2/2] Starting Frontend Server (Port 3000)...
start "Obedio Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

REM Wait 5 seconds for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo    SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul

REM Open browser
start http://localhost:3000

echo.
echo System is ready for presentation!
echo.
echo IMPORTANT: Do NOT close the Backend and Frontend windows!
echo.
pause
