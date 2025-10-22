@echo off
title OBEDIO - System Shutdown
color 0C
cls

echo.
echo ========================================
echo    OBEDIO SYSTEM SHUTDOWN
echo ========================================
echo.

echo Stopping servers...
echo.

REM Function to kill process by port
echo [1/3] Stopping Backend API Server (Port 8080)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    set PID=%%a
)
if defined PID (
    taskkill /F /PID %PID% >nul 2>&1
    echo      Backend stopped.
) else (
    echo      Backend not running.
)

timeout /t 1 /nobreak >nul

echo [2/3] Stopping Frontend Server (Port 5173)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    set PID2=%%a
)
if defined PID2 (
    taskkill /F /PID %PID2% >nul 2>&1
    echo      Frontend stopped.
) else (
    echo      Frontend not running.
)

timeout /t 1 /nobreak >nul

echo [3/3] Cleaning up any remaining OBEDIO processes...
REM Kill by window title as backup
taskkill /FI "WINDOWTITLE eq OBEDIO Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq OBEDIO Frontend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator:  OBEDIO Backend API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Administrator:  OBEDIO Frontend*" /F >nul 2>&1

timeout /t 2 /nobreak >nul

REM Verify ports are free
set BACKEND_STILL_RUNNING=0
set FRONTEND_STILL_RUNNING=0

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 set BACKEND_STILL_RUNNING=1

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 set FRONTEND_STILL_RUNNING=1

echo.
echo ========================================
echo    SHUTDOWN COMPLETE
echo ========================================
echo.

if %BACKEND_STILL_RUNNING%==1 (
    echo WARNING: Port 8080 still in use!
    echo         Another process may be using this port.
) else (
    echo Backend API:  OFFLINE ✓
)

if %FRONTEND_STILL_RUNNING%==1 (
    echo WARNING: Port 5173 still in use!
    echo         Another process may be using this port.
) else (
    echo Frontend App: OFFLINE ✓
)

echo Database:     Still running (PostgreSQL)
echo.
echo System is now offline.
echo Use START-OBEDIO.bat to restart.
echo.
pause
