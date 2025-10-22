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

REM Kill processes by port to avoid killing unrelated Node processes
echo Stopping Backend API (Port 8080)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping Frontend (Port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Also kill by window title as backup
taskkill /FI "WINDOWTITLE eq OBEDIO Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq OBEDIO Frontend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator:  OBEDIO Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator:  OBEDIO Frontend*" /F >nul 2>&1

timeout /t 3 /nobreak >nul

echo ✓ Servers stopped
echo.

echo [Phase 2/2] Starting servers...
echo.

REM Start Backend Server
echo Starting Backend API Server...
start "OBEDIO Backend API" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 5 /nobreak >nul

REM Verify backend started
netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo ✓ Backend started
) else (
    echo ✗ Backend failed to start!
)

REM Start Frontend Server
echo Starting Frontend Web Server...
start "OBEDIO Frontend" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 8 /nobreak >nul

REM Verify frontend started
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo ✓ Frontend started
) else (
    echo ✗ Frontend failed to start!
)

echo.
echo ========================================
echo    RESTART COMPLETE!
echo ========================================
echo.
echo Backend API:  http://localhost:8080/api
echo Frontend App: http://localhost:5173
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul

start http://localhost:5173

echo.
echo System restarted successfully!
echo Login: admin / admin123
echo.
pause
