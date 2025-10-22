@echo off
title OBEDIO - Create Admin User
color 0E
cls

echo.
echo ========================================
echo    OBEDIO - CREATE ADMIN USER
echo ========================================
echo.
echo This will create/reset the admin user:
echo.
echo  Username: admin
echo  Password: admin123
echo.
pause

echo.
echo Creating admin user...
call npm run db:seed-admin

echo.
echo ========================================
echo  ADMIN USER CREATED!
echo ========================================
echo.
echo You can now login with:
echo  Username: admin
echo  Password: admin123
echo.
pause
