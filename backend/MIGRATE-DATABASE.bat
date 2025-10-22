@echo off
title OBEDIO - Database Migration
color 0E
cls

echo.
echo ========================================
echo  OBEDIO - Database Migration
echo ========================================
echo.
echo This will update the database schema with new guest fields:
echo  - Check-in/Check-out dates
echo  - Dietary restrictions and allergies
echo  - Medical conditions
echo  - Preferences and notes
echo  - Emergency contact information
echo.
echo WARNING: This will modify the database structure!
echo.
pause

echo.
echo [1/3] Generating Prisma Client with new schema...
call npx prisma generate

echo.
echo [2/3] Creating and applying migration...
call npx prisma migrate dev --name add_guest_profile_fields

echo.
echo ========================================
echo  MIGRATION COMPLETE!
echo ========================================
echo.
echo Database schema updated successfully.
echo Backend server will need to be restarted.
echo.
echo Press any key to restart backend...
pause

cd..
call RESTART-OBEDIO.bat
