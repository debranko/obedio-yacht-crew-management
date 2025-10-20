@echo off
echo ========================================
echo  OBEDIO YACHT CREW - STARTING SERVICES
echo ========================================
echo.

REM Check if setup was done
if not exist backend\.env (
    echo ❌ Backend not configured!
    echo    Please run SETUP-COMPLETE.bat first
    pause
    exit /b 1
)

if not exist backend\node_modules (
    echo ❌ Backend dependencies not installed!
    echo    Please run SETUP-COMPLETE.bat first
    pause
    exit /b 1
)

if not exist node_modules (
    echo ❌ Frontend dependencies not installed!
    echo    Please run SETUP-COMPLETE.bat first
    pause
    exit /b 1
)

echo ✅ All checks passed!
echo.
echo 🚀 Starting services...
echo.
echo    Backend will start on: http://localhost:3001
echo    Frontend will start on: http://localhost:3000
echo.
echo ⚠️  Keep this window open! Closing it will stop both servers.
echo.
echo ========================================
echo.

REM Start backend in a new window
start "Obedio Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in current window
echo Starting frontend...
npm run dev
