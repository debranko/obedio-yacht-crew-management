@echo off
title OBEDIO - Database Reset and Seed
color 0E
cls

echo.
echo ========================================
echo  OBEDIO - Database Reset and Seed
echo ========================================
echo.
echo This will:
echo  - Reset database (delete all data)
echo  - Create 18 locations (Real Yacht Layout)
echo  - Create 16 celebrity guests
echo  - Create 8 Interior crew members
echo.
pause

echo.
echo [1/3] Resetting database...
call npm run db:reset

echo.
echo [2/3] Running seed script...
call npm run db:seed

echo.
echo [3/3] Verifying data...
call npm run db:studio

echo.
echo ========================================
echo  DONE! Database populated successfully!
echo ========================================
echo.
echo IMPORTANT: Clear browser cache!
echo.
echo Press F12 in browser, go to Console, run:
echo   localStorage.clear(); location.reload();
echo.
pause
