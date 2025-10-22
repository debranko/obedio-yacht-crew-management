@echo off
echo ===============================================
echo WARNING: This will delete and reinstall everything!
echo ===============================================
echo.
pause
echo.
echo Starting complete reset...
powershell -ExecutionPolicy Bypass -File "%~dp0reset.ps1"
