@echo off
echo ========================================
echo FORCE RESTART FRONTEND WITH NEW ENV
echo ========================================
echo.

echo Step 1: Killing all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo Step 2: Clearing Vite cache...
rmdir /s /q node_modules\.vite 2>nul

echo.
echo Step 3: Verifying .env file...
type .env | findstr "VITE_MQTT_BROKER"
if %errorlevel% neq 0 (
    echo.
    echo ERROR: VITE_MQTT_BROKER not found in .env!
    echo Adding it now...
    echo VITE_MQTT_BROKER=ws://localhost:9001 >> .env
)

echo.
echo Step 4: Starting frontend with clean environment...
echo.

echo Starting Vite development server...
echo ========================================
npm run dev

echo.
echo ========================================
echo Frontend should now load with MQTT URL!
echo Check browser console for:
echo "📍 MQTT Broker URL from env: ws://localhost:9001"
echo ========================================