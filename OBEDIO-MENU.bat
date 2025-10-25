@echo off
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
start http://localhost:5555
echo.
echo Prisma Studio opened at http://localhost:5555
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
start http://localhost:5173
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
start http://localhost:8888
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
