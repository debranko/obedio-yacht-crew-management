@echo off
title OBEDIO - System Restart
color 0E
cls

echo.
echo ========================================
echo    OBEDIO SYSTEM RESTART
echo ========================================
echo.

echo [Phase 1/2] Stopping current services...
echo.

REM Call STOP script to stop all services
call "%~dp0STOP-OBEDIO.bat"

echo.
echo ========================================
echo.
echo [Phase 2/2] Starting services...
echo.
echo Press any key to start services...
pause >nul

REM Call START script to start all services
call "%~dp0START-OBEDIO.bat"
