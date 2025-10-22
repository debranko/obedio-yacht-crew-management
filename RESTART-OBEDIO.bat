@echo off
title OBEDIO - System Restart
color 0E
cls

echo.
echo ========================================
echo    OBEDIO SYSTEM RESTART
echo ========================================
echo.

echo [Phase 1/2] Stopping current servers...
echo.

REM Stop all Node processes
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo ✓ Servers stopped
echo.

echo [Phase 2/2] Starting servers...
echo.
timeout /t 2 /nobreak >nul

REM Start Backend Server
echo Starting Backend API Server...
start "OBEDIO Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 5 /nobreak >nul

REM Start Frontend Server
echo Starting Frontend Web Server...
start "OBEDIO Frontend" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 8 /nobreak >nul

echo.
echo ========================================
echo    RESTART COMPLETE!
echo ========================================
echo.
echo Backend API:  http://localhost:3001/api
echo Frontend App: http://localhost:5173
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul

start http://localhost:5173

echo.
echo System restarted successfully!
echo Login: admin / password
echo.
pause
