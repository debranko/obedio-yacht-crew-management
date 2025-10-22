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

REM Check if any Node.js processes are running
tasklist | findstr "node.exe" >nul
if %errorlevel%==1 (
    echo No Node.js processes found running.
    echo System is already stopped.
    goto :already_stopped
)

REM Close specific window titles
echo [1/4] Closing Backend API window...
taskkill /FI "WINDOWTITLE eq OBEDIO Backend API*" /F >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/4] Closing Frontend window...
taskkill /FI "WINDOWTITLE eq OBEDIO Frontend*" /F >nul 2>&1
timeout /t 1 /nobreak >nul

echo [3/4] Checking for remaining Node.js processes...
tasklist | findstr "node.exe" >nul
if %errorlevel%==0 (
    echo Found remaining Node.js processes. Stopping them...
    taskkill /F /IM node.exe >nul 2>&1
    timeout /t 2 /nobreak >nul
) else (
    echo No remaining Node.js processes.
)

echo [4/4] Verifying ports are free...
timeout /t 1 /nobreak >nul
netstat -ano | findstr ":3001" >nul
if %errorlevel%==0 (
    echo WARNING: Port 3001 still in use. Finding and killing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)

netstat -ano | findstr ":5173" >nul
if %errorlevel%==0 (
    echo WARNING: Port 5173 still in use. Finding and killing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)

timeout /t 1 /nobreak >nul

:already_stopped

echo.
echo ========================================
echo    ALL SERVERS STOPPED!
echo ========================================
echo.
echo Backend API:  OFFLINE
echo Frontend App: OFFLINE
echo Database:     Still running (PostgreSQL)
echo.
echo System is now offline.
echo Use START-OBEDIO.bat to restart.
echo.
pause
