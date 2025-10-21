@echo off
title Obedio - Shutdown
color 0C

echo.
echo ========================================
echo    STOPPING OBEDIO SERVERS
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo ========================================
echo    ALL SERVERS STOPPED!
echo ========================================
echo.
echo Obedio system is now offline.
echo.
pause
