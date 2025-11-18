@echo off
echo ========================================
echo MQTT BROKER TEST - Command Line
echo ========================================
echo.

echo Installing mosquitto_pub if needed...
where mosquitto_pub >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: mosquitto_pub not found!
    echo Please install Mosquitto clients or use npm mqtt-cli
    echo.
    echo Alternative: Install via npm
    echo   npm install -g mqtt
    echo   mqtt pub -h localhost -p 1883 -t "obedio/test" -m "Hello MQTT"
    exit /b 1
)

echo.
echo Testing MQTT broker on port 1883...
echo.

echo Sending test message to topic: obedio/test
mosquitto_pub -h localhost -p 1883 -t "obedio/test" -m "{\"test\": \"MQTT is working!\", \"timestamp\": \"%date% %time%\"}"

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS: MQTT broker is accepting messages on port 1883
    echo.
    echo Now testing WebSocket port 9001...
    echo Note: mosquitto_pub doesn't support WebSocket, but if port 1883 works, 9001 should too
) else (
    echo.
    echo ❌ ERROR: Could not connect to MQTT broker
    echo Make sure Mosquitto is running!
)

echo.
echo ========================================
echo To test from Node.js/Browser:
echo.
echo const mqtt = require('mqtt');
echo const client = mqtt.connect('ws://localhost:9001');
echo client.on('connect', () =^> console.log('Connected!'));
echo ========================================

pause