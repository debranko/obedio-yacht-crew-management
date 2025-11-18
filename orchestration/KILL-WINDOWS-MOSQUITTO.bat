@echo off
echo ========================================
echo  KILL WINDOWS MOSQUITTO
echo ========================================
echo.
echo This will stop the Windows Mosquitto service
echo that's blocking Docker Mosquitto.
echo.
pause

echo.
echo [1/3] Stopping Mosquitto service...
net stop mosquitto 2>nul
if %errorlevel%==0 (
    echo      ✓ Service stopped
) else (
    echo      ! Service not found or already stopped
)

echo.
echo [2/3] Killing Mosquitto process (PID 14020)...
taskkill /F /PID 14020 2>nul
if %errorlevel%==0 (
    echo      ✓ Process killed
) else (
    echo      ! Process not found or already dead
)

echo.
echo [3/3] Disabling Mosquitto service (preventing auto-start)...
sc config mosquitto start= disabled 2>nul
if %errorlevel%==0 (
    echo      ✓ Service disabled
) else (
    echo      ! Service config failed (might need admin rights)
)

echo.
echo ========================================
echo  DONE!
echo ========================================
echo.
echo Now run RESTART-OBEDIO.bat to start fresh.
echo.
pause
