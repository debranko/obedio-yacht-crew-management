@echo off
title OBEDIO - Force Stop
color 0C
cls

echo.
echo ========================================
echo    OBEDIO FORCE STOP
echo ========================================
echo.
echo WARNING: This will forcefully kill ALL Node.js processes!
echo This should only be used if normal STOP-OBEDIO.bat fails.
echo.
pause

echo.
echo Forcefully stopping all Node.js processes...
echo.

REM Kill all Node.js processes
taskkill /F /IM node.exe /T 2>nul
if %errorlevel%==0 (
    echo Node.js processes killed.
) else (
    echo No Node.js processes were running.
)

echo.
echo Waiting for processes to terminate...
timeout /t 3 /nobreak >nul

echo.
echo Checking ports...
netstat -ano | findstr ":3001 :5173" >nul
if %errorlevel%==0 (
    echo.
    echo Some ports still occupied. Killing processes by port...
    echo.
    
    REM Kill process on port 3001
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do (
        echo Killing process on port 3001 (PID: %%a^)
        taskkill /F /PID %%a >nul 2>&1
    )
    
    REM Kill process on port 5173
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173"') do (
        echo Killing process on port 5173 (PID: %%a^)
        taskkill /F /PID %%a >nul 2>&1
    )
    
    timeout /t 2 /nobreak >nul
)

echo.
echo ========================================
echo    FORCE STOP COMPLETE!
echo ========================================
echo.
echo All Node.js processes terminated.
echo Ports 3001 and 5173 should now be free.
echo.
echo You can now run START-OBEDIO.bat
echo.
pause
