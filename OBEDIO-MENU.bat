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
echo  [1] START System
echo  [2] STOP System
echo  [3] RESTART System
echo  [9] FORCE STOP (if normal stop fails)
echo.
echo  [4] Reset Database + Seed
echo  [5] Seed Database Only
echo  [6] Open Prisma Studio
echo.
echo  [7] Open Web App (Browser)
echo  [8] View Celebrity Guests
echo.
echo  [0] Exit
echo.
echo ========================================
echo.

set /p choice="Choose option (0-9): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="9" goto force_stop
if "%choice%"=="4" goto reset_db
if "%choice%"=="5" goto seed_only
if "%choice%"=="6" goto prisma_studio
if "%choice%"=="7" goto open_browser
if "%choice%"=="8" goto show_guests
if "%choice%"=="0" goto exit

echo Invalid option!
timeout /t 2 /nobreak >nul
goto menu

:start
cls
echo Starting OBEDIO System...
call START-OBEDIO.bat
goto menu

:stop
cls
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
echo Force Stopping OBEDIO System...
call FORCE-STOP.bat
goto menu

:reset_db
cls
echo Resetting Database...
cd backend
call FIX-DATABASE.bat
cd..
goto menu

:seed_only
cls
echo Seeding Database...
cd backend
call RUN-SEED-ONLY.bat
cd..
goto menu

:prisma_studio
cls
echo Opening Prisma Studio...
cd backend
start cmd /k "npx prisma studio"
cd..
timeout /t 3 /nobreak >nul
start http://localhost:5555
echo Prisma Studio opened at http://localhost:5555
timeout /t 3 /nobreak >nul
goto menu

:open_browser
cls
echo Opening Web App...
start http://localhost:5173
echo.
echo If page doesn't load, start the system first (Option 1)
timeout /t 3 /nobreak >nul
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
echo   - Timothee Chalamet
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

:exit
cls
echo.
echo Thank you for using OBEDIO!
echo.
timeout /t 2 /nobreak >nul
exit
