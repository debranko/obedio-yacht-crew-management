@echo off
echo.
echo ========================================
echo    OBEDIO Project Manager - Web App
echo ========================================
echo.
echo Starting server...
echo.

cd /d "%~dp0"

start http://localhost:3333

node server.js
