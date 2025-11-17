@echo off
title OBEDIO - Restart Frontend
color 0B
cls

echo.
echo ========================================
echo    RESTARTING FRONTEND SERVER
echo ========================================
echo.
echo This will reload environment variables...
echo.

REM Kill frontend process
echo Stopping frontend server (Port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

REM Kill by window title as backup
taskkill /FI "WINDOWTITLE eq OBEDIO Frontend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator:  OBEDIO Frontend*" /F >nul 2>&1

echo Frontend stopped.
echo.
echo Starting frontend with updated environment...
start "OBEDIO Frontend" cmd /k "npm run dev"

echo.
echo Waiting for frontend to start...
timeout /t 8 /nobreak >nul

REM Verify frontend started
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo ✓ Frontend restarted successfully!
    echo.
    echo Opening browser...
    start http://localhost:5173
) else (
    echo ✗ Frontend failed to start!
    echo Check the frontend window for errors.
)

echo.
echo ========================================
echo IMPORTANT: MQTT should now work!
echo ========================================
echo.
echo 1. Open the web app
echo 2. Check browser console (F12) for:
echo    "✅ Button Simulator: MQTT connected successfully"
echo 3. Use ESP32 Simulator in sidebar
echo 4. Watch MQTT Monitor at http://localhost:8888
echo.
pause