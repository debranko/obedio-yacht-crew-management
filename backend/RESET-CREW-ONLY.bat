@echo off
title OBEDIO - Reset Crew (Interior Only)
color 0E
cls

echo.
echo ========================================
echo    OBEDIO - RESET CREW DATA
echo ========================================
echo.
echo This will DELETE all existing crew members and
echo re-seed with INTERIOR DEPARTMENT ONLY (8 stewardesses).
echo.
echo Removed departments:
echo  - Deck (Captain, Officers, Deckhand)
echo  - Engineering (Engineers, ETO)
echo  - Galley (Chefs)
echo.
echo Remaining:
echo  - Interior (8 Stewardesses)
echo.
echo WARNING: This will DELETE existing crew data!
echo.
pause

echo.
echo [1/2] Running database reset and seed...
call reset-and-seed.bat

echo.
echo [2/2] Crew list after reset:
call npx prisma studio --browser none

echo.
echo ========================================
echo  CREW RESET COMPLETE!
echo ========================================
echo.
echo Database now has:
echo  - 8 Interior Department crew members
echo  - 0 Deck crew
echo  - 0 Engineering crew
echo  - 0 Galley crew
echo.
echo Refresh the Crew page to see changes.
echo.
pause
