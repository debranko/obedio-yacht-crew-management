@echo off
setlocal enabledelayedexpansion
title OBEDIO - Control Panel
color 0B

:menu
cls
echo.
echo ========================================
echo    OBEDIO CONTROL PANEL
echo ========================================
echo    Luxury Yacht Management System
echo ========================================
echo.

REM Check current system status
set BACKEND_STATUS=OFFLINE
set FRONTEND_STATUS=OFFLINE
set MQTT_STATUS=OFFLINE

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %errorlevel%==0 set BACKEND_STATUS=ONLINE

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel%==0 set FRONTEND_STATUS=ONLINE

docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}" | findstr "Up" >nul 2>&1
if %errorlevel%==0 set MQTT_STATUS=ONLINE

echo System Status:
echo   MQTT:     %MQTT_STATUS%
echo   Backend:  %BACKEND_STATUS%
echo   Frontend: %FRONTEND_STATUS%
echo.
echo ========================================
echo.
echo  [1] START System
echo  [2] STOP System
echo  [3] RESTART System
echo  [4] FORCE STOP (kill all Node processes)
echo.
echo  [5] Reset Database + Seed
echo  [6] Seed Database Only
echo  [7] Open Prisma Studio
echo  [8] Fix Admin Password
echo.
echo  [9] Open Web App (Browser)
echo  [M] Open MQTT Monitor Dashboard
echo  [C] View Celebrity Guests
echo  [S] System Status Details
echo.
echo  [W] Update Wear OS IP Address
echo  [I] Check Current IP Address
echo  [A] Auto-Update ALL IP Addresses (Backend+Frontend+Wear OS)
echo  [B] Build and Install APK on Watches
echo.
echo  [0] Exit
echo.
echo ========================================
echo.

set /p choice="Choose option: "

if /i "%choice%"=="1" goto start
if /i "%choice%"=="2" goto stop
if /i "%choice%"=="3" goto restart
if /i "%choice%"=="4" goto force_stop
if /i "%choice%"=="5" goto reset_db
if /i "%choice%"=="6" goto seed_only
if /i "%choice%"=="7" goto prisma_studio
if /i "%choice%"=="8" goto fix_admin
if /i "%choice%"=="9" goto open_browser
if /i "%choice%"=="m" goto mqtt_monitor
if /i "%choice%"=="c" goto show_guests
if /i "%choice%"=="s" goto system_status
if /i "%choice%"=="w" goto update_wearos_ip
if /i "%choice%"=="i" goto check_ip
if /i "%choice%"=="a" goto auto_update_all_ip
if /i "%choice%"=="b" goto build_install_apk
if /i "%choice%"=="0" goto exit

echo Invalid option!
timeout /t 2 /nobreak >nul
goto menu

:start
cls
if "%BACKEND_STATUS%"=="ONLINE" (
    echo.
    echo WARNING: System already running!
    echo Use option 3 to restart.
    echo.
    pause
    goto menu
)
echo Starting OBEDIO System...
call START-OBEDIO.bat
goto menu

:stop
cls
if "%BACKEND_STATUS%"=="OFFLINE" (
    echo.
    echo System is already stopped.
    echo.
    pause
    goto menu
)
echo Stopping OBEDIO System...
call STOP-OBEDIO.bat
goto menu

:restart
cls
echo Restarting OBEDIO System...
call RESTART-OBEDIO.bat
goto menu

:force_stop
cls
echo.
echo ========================================
echo    FORCE STOP - WARNING!
echo ========================================
echo.
echo This will kill ALL Node.js processes on your system,
echo not just OBEDIO processes!
echo.
echo Are you sure you want to continue?
echo.
choice /c YN /n /m "Press Y for Yes, N for No: "
if errorlevel 2 goto menu
echo.
echo Force stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo Done.
echo.
pause
goto menu

:reset_db
cls
echo Resetting Database...
cd backend
if exist "FIX-DATABASE.bat" (
    call FIX-DATABASE.bat
) else (
    echo.
    echo Running Prisma migration reset...
    call npx prisma migrate reset --force
    echo.
    echo Running database seed...
    call npm run seed
)
cd..
echo.
echo Database reset complete!
pause
goto menu

:seed_only
cls
echo Seeding Database...
cd backend
if exist "RUN-SEED-ONLY.bat" (
    call RUN-SEED-ONLY.bat
) else (
    echo Running database seed...
    call npm run seed
)
cd..
echo.
echo Database seeding complete!
pause
goto menu

:prisma_studio
cls
echo Opening Prisma Studio...
cd backend
start "Prisma Studio" cmd /k "npx prisma studio"
cd..
timeout /t 3 /nobreak >nul
start http://10.10.0.207:5555
echo.
echo Prisma Studio opened at http://10.10.0.207:5555
echo.
pause
goto menu

:fix_admin
cls
echo Fixing Admin Password...
cd backend
if exist "fix-admin-password.ts" (
    call npx ts-node fix-admin-password.ts
) else (
    echo.
    echo fix-admin-password.ts not found!
    echo Cannot fix admin password.
)
cd..
echo.
echo Admin password reset to: admin123
echo.
pause
goto menu

:open_browser
cls
echo Opening Web App...
start http://10.10.0.207:5173
echo.
if "%FRONTEND_STATUS%"=="OFFLINE" (
    echo WARNING: Frontend server is not running!
    echo Start the system first (Option 1)
)
echo.
pause
goto menu

:mqtt_monitor
cls
echo Opening MQTT Monitor Dashboard...
start http://10.10.0.207:8888
echo.
if "%MQTT_STATUS%"=="OFFLINE" (
    echo WARNING: MQTT Broker is not running!
    echo Start the system first (Option 1)
)
echo.
pause
goto menu

:show_guests
cls
echo.
echo ========================================
echo    CELEBRITY GUESTS IN DATABASE
echo ========================================
echo.
echo  Master Suite:
echo   - Leonardo DiCaprio (Owner)
echo   - Scarlett Johansson (Partner)
echo.
echo  VIP Suite 1:
echo   - George Clooney
echo   - Amal Clooney
echo.
echo  VIP Suite 2:
echo   - Chris Hemsworth
echo   - Elsa Pataky
echo.
echo  Guest Cabin 1:
echo   - Ed Sheeran
echo   - Cherry Seaborn
echo.
echo  Guest Cabin 2:
echo   - Timothée Chalamet
echo   - Zendaya Coleman
echo.
echo  Guest Cabin 3:
echo   - Dwayne "The Rock" Johnson
echo   - Lauren Hashian
echo.
echo  Guest Cabin 4:
echo   - Ryan Reynolds
echo   - Blake Lively
echo.
echo ========================================
echo.
pause
goto menu

:system_status
cls
echo.
echo ========================================
echo    SYSTEM STATUS DETAILS
echo ========================================
echo.

REM Check MQTT Broker
echo Mosquitto MQTT Broker:
docker ps --filter "name=obedio-mosquitto" --format "{{.Names}} - {{.Status}}" 2>nul | findstr "obedio-mosquitto" >nul
if %errorlevel%==0 (
    for /f "delims=" %%a in ('docker ps --filter "name=obedio-mosquitto" --format "{{.Status}}"') do (
        echo   Status: ONLINE (%%a)
    )
) else (
    echo   Status: OFFLINE
)
echo   TCP Port: 1883 (devices/backend)
echo   WebSocket: 9001 (browser/frontend)

echo.

REM Check Backend
echo Backend API Server (Port 8080):
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo   Status: ONLINE (PID: %%a)
    goto backend_done
)
echo   Status: OFFLINE
:backend_done

echo.

REM Check Frontend
echo Frontend Web Server (Port 5173):
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo   Status: ONLINE (PID: %%a)
    goto frontend_done
)
echo   Status: OFFLINE
:frontend_done

echo.

REM Check Database
echo PostgreSQL Database:
sc query postgresql* >nul 2>&1
if %errorlevel%==0 (
    echo   Status: ONLINE (Windows Service)
) else (
    pg_ctl status -D "%PGDATA%" >nul 2>&1
    if %errorlevel%==0 (
        echo   Status: ONLINE
    ) else (
        echo   Status: UNKNOWN (check manually)
    )
)

echo.

REM Check MQTT Monitor
echo MQTT Monitor Dashboard (Port 8888):
netstat -ano | findstr ":8888" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo   Status: ONLINE
) else (
    echo   Status: OFFLINE (launches with backend)
)

echo.

REM Check Prisma Studio
echo Prisma Studio (Port 5555):
netstat -ano | findstr ":5555" | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo   Status: ONLINE
) else (
    echo   Status: OFFLINE
)

echo.
echo ========================================
echo.
pause
goto menu

:check_ip
cls
echo.
echo ========================================
echo    CURRENT IP ADDRESS
echo ========================================
echo.
echo System IP Address:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo   !IP!
)
echo.
echo Wear OS Configuration:
findstr "DEFAULT_IP" "ObedioWear old\app\src\main\java\com\example\obediowear\utils\ServerConfig.kt" | findstr "10\."
echo.
pause
goto menu

:update_wearos_ip
cls
echo.
echo ========================================
echo    UPDATE WEAR OS IP ADDRESS
echo ========================================
echo.
echo Current IP in Wear OS app (ServerConfig.kt):
for /f "tokens=2 delims==" %%a in ('findstr "DEFAULT_IP" "ObedioWear old\app\src\main\java\com\example\obediowear\utils\ServerConfig.kt"') do (
    echo   %%a
)
echo.
echo Your system IP addresses:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    echo   !IP!
)
echo.
echo ========================================
echo.
set /p NEW_IP="Enter new IP address (e.g., 10.10.0.207): "

REM Validate IP format (basic check)
echo %NEW_IP% | findstr /r "^[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Invalid IP address format!
    echo.
    pause
    goto menu
)

echo.
echo ========================================
echo    CONFIRMATION
echo ========================================
echo.
echo You are about to change IP address to: %NEW_IP%
echo.
echo This will update:
echo   1. ServerConfig.kt (DEFAULT_IP)
echo.
choice /c YN /n /m "Continue? (Y/N): "
if errorlevel 2 goto menu

echo.
echo Updating IP address in Wear OS ServerConfig.kt...
echo.

REM Update ServerConfig.kt
powershell -Command "(Get-Content 'ObedioWear old\app\src\main\java\com\example\obediowear\utils\ServerConfig.kt') -replace 'DEFAULT_IP = \"[0-9.]+\"', 'DEFAULT_IP = \"%NEW_IP%\"' | Set-Content 'ObedioWear old\app\src\main\java\com\example\obediowear\utils\ServerConfig.kt'"
echo   [OK] ServerConfig.kt updated

echo.
echo ========================================
echo    IP UPDATE COMPLETE!
echo ========================================
echo.
echo Would you like to build and install the APK now?
echo.
choice /c YN /n /m "(Y/N): "
if errorlevel 2 (
    echo.
    echo Skipping build. You can build manually later.
    echo.
    pause
    goto menu
)

echo.
echo ========================================
echo    BUILDING APK...
echo ========================================
echo.
cd "ObedioWear old"
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo.
    cd..
    pause
    goto menu
)
cd..

echo.
echo ========================================
echo    INSTALLING ON WATCHES...
echo ========================================
echo.

REM Check if watches are connected
"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices | findstr "device" | findstr -v "List" >nul
if %errorlevel% neq 0 (
    echo WARNING: No watches connected via ADB!
    echo.
    echo To connect watches:
    echo   1. Enable WiFi Debugging on each watch
    echo   2. Run: adb connect [watch_ip]:5555
    echo.
    pause
    goto menu
)

echo Uninstalling old version...
"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s adb-C101X3A271199-pMG9i0._adb-tls-connect._tcp uninstall com.example.obediowear 2>nul
"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s adb-C101X3B220410-Q2LfOc._adb-tls-connect._tcp uninstall com.example.obediowear 2>nul

echo Installing new version...
"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s adb-C101X3A271199-pMG9i0._adb-tls-connect._tcp install "ObedioWear old\app\build\outputs\apk\debug\app-debug.apk"
"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s adb-C101X3B220410-Q2LfOc._adb-tls-connect._tcp install "ObedioWear old\app\build\outputs\apk\debug\app-debug.apk"

echo.
echo ========================================
echo    INSTALLATION COMPLETE!
echo ========================================
echo.
echo New IP address: %NEW_IP%
echo APK installed on all connected watches.
echo.
pause
goto menu

:auto_update_all_ip
cls
echo.
echo ========================================
echo    AUTO-UPDATE ALL IP ADDRESSES
echo ========================================
echo.
echo Detecting current Wi-Fi IP address...
echo.

REM Get Wi-Fi IP address only
set WIFI_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"Wireless LAN adapter Wi-Fi" /A:2 ^| findstr /C:"IPv4 Address"') do (
    set WIFI_IP=%%a
    set WIFI_IP=!WIFI_IP:~1!
    goto ip_found
)

REM Alternative method - get first non-local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set TEMP_IP=%%a
    set TEMP_IP=!TEMP_IP:~1!
    echo !TEMP_IP! | findstr /C:"127.0.0.1" >nul
    if errorlevel 1 (
        echo !TEMP_IP! | findstr /C:"169.254" >nul
        if errorlevel 1 (
            set WIFI_IP=!TEMP_IP!
            goto ip_found
        )
    )
)

:ip_found
if "%WIFI_IP%"=="" (
    echo ERROR: Could not detect Wi-Fi IP address!
    echo.
    pause
    goto menu
)

echo Detected IP: %WIFI_IP%
echo.
echo ========================================
echo    FILES TO UPDATE
echo ========================================
echo.
echo   1. "ObedioWear old" ServerConfig.kt (DEFAULT_IP)
echo   2. OBEDIO-MENU.bat (This file URLs)
echo.
choice /c YN /n /m "Update all files with IP %WIFI_IP%? (Y/N): "
if errorlevel 2 goto menu

echo.
echo Updating files...
echo.

REM 1. Update Wear OS ServerConfig.kt
powershell -Command "(Get-Content 'ObedioWear old\app\src\main\java\com\example\obediowear\utils\ServerConfig.kt') -replace 'DEFAULT_IP = \"[0-9.]+\"', 'DEFAULT_IP = \"%WIFI_IP%\"' | Set-Content 'ObedioWear old\app\src\main\java\com\example\obediowear\utils\ServerConfig.kt'"
echo   [1/2] ServerConfig.kt updated

REM 2. Update OBEDIO-MENU.bat (this file)
powershell -Command "(Get-Content 'OBEDIO-MENU.bat') -replace 'http://[0-9.]+:5555', 'http://%WIFI_IP%:5555' | Set-Content 'OBEDIO-MENU.bat'"
powershell -Command "(Get-Content 'OBEDIO-MENU.bat') -replace 'http://[0-9.]+:5173', 'http://%WIFI_IP%:5173' | Set-Content 'OBEDIO-MENU.bat'"
powershell -Command "(Get-Content 'OBEDIO-MENU.bat') -replace 'http://[0-9.]+:8888', 'http://%WIFI_IP%:8888' | Set-Content 'OBEDIO-MENU.bat'"
echo   [2/2] OBEDIO-MENU.bat updated

echo.
echo ========================================
echo    ALL FILES UPDATED!
echo ========================================
echo.
echo New IP Address: %WIFI_IP%
echo.
echo Updated:
echo   • Wear OS ServerConfig.kt
echo   • OBEDIO-MENU.bat
echo.
echo NOTE: Menu will reload to apply changes.
echo.
pause
goto menu

:build_install_apk
cls
echo.
echo ========================================
echo    BUILD AND INSTALL APK ON WATCHES
echo ========================================
echo.
echo This will:
echo   1. Build APK from "ObedioWear old"
echo   2. Uninstall old version from connected watches
echo   3. Install new version on all connected watches
echo.
choice /c YN /n /m "Continue? (Y/N): "
if errorlevel 2 goto menu

echo.
echo ========================================
echo    BUILDING APK...
echo ========================================
echo.
cd "ObedioWear old"
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    echo Check the output above for errors.
    echo.
    cd..
    pause
    goto menu
)
cd..

echo.
echo Build successful!
echo APK location: ObedioWear old\app\build\outputs\apk\debug\app-debug.apk
echo.

echo ========================================
echo    DETECTING WATCHES...
echo ========================================
echo.

REM Check if any watches are connected
"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices | findstr "device" | findstr -v "List" >nul
if %errorlevel% neq 0 (
    echo WARNING: No watches connected via ADB!
    echo.
    echo To connect watches:
    echo   1. Enable WiFi Debugging on each watch
    echo   2. Settings -^> Developer Options -^> ADB Debugging (WiFi)
    echo   3. Note the watch IP address
    echo   4. Run: adb connect [watch_ip]:5555
    echo.
    echo Example:
    echo   adb connect 10.10.0.123:5555
    echo.
    pause
    goto menu
)

echo Connected watches:
"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices | findstr "device" | findstr -v "List"
echo.

echo ========================================
echo    INSTALLING ON WATCHES...
echo ========================================
echo.

REM Uninstall old version from all connected devices
echo [1/2] Uninstalling old version...
for /f "tokens=1" %%d in ('"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices ^| findstr "device" ^| findstr -v "List"') do (
    "C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s %%d uninstall com.example.obediowear 2>nul
)
echo   Done.
echo.

REM Install new version on all connected devices
echo [2/2] Installing new version...
set INSTALL_SUCCESS=0
set INSTALL_FAIL=0
for /f "tokens=1" %%d in ('"C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" devices ^| findstr "device" ^| findstr -v "List"') do (
    echo   Installing on %%d...
    "C:\Users\debra\AppData\Local\Android\Sdk\platform-tools\adb.exe" -s %%d install "ObedioWear old\app\build\outputs\apk\debug\app-debug.apk" >nul 2>&1
    if %errorlevel%==0 (
        echo   [OK] %%d
        set /a INSTALL_SUCCESS+=1
    ) else (
        echo   [FAIL] %%d
        set /a INSTALL_FAIL+=1
    )
)
echo.

echo ========================================
echo    INSTALLATION COMPLETE!
echo ========================================
echo.
echo Results:
echo   Success: %INSTALL_SUCCESS% watch(es)
echo   Failed:  %INSTALL_FAIL% watch(es)
echo.
if %INSTALL_SUCCESS% gtr 0 (
    echo APK successfully installed on %INSTALL_SUCCESS% watch(es^).
    echo You can now launch "ObedioWear" from the watch app drawer.
)
if %INSTALL_FAIL% gtr 0 (
    echo.
    echo TROUBLESHOOTING:
    echo   - Ensure watch WiFi debugging is enabled
    echo   - Check watch is connected: adb devices
    echo   - Reconnect: adb connect [watch_ip]:5555
)
echo.
pause
goto menu

:exit
cls
echo.
echo ========================================
echo    Thank you for using OBEDIO!
echo ========================================
echo.
echo Shutting down control panel...
timeout /t 2 /nobreak >nul
exit
