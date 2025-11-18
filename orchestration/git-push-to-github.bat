@echo off
echo ========================================
echo  PUSH TO GITHUB - Obedio Yacht Crew
echo ========================================
echo.

REM GitHub repository
set REPO_URL=https://github.com/debranko/obedio-yacht-crew-management.git

echo Repository: %REPO_URL%
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git is not installed!
    echo    Please install Git from https://git-scm.com
    pause
    exit /b 1
)

echo ✅ Git detected
echo.

REM Check if .git exists
if not exist .git (
    echo 📦 Initializing Git repository...
    git init
    git branch -M main
    echo ✅ Git initialized
    echo.
)

REM Check if remote exists
git remote get-url origin >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔗 Adding remote repository...
    git remote add origin %REPO_URL%
    echo ✅ Remote added
    echo.
) else (
    echo ✅ Remote already configured
    echo.
)

REM Check .gitignore
if not exist .gitignore (
    echo ⚠️  .gitignore not found!
    echo    Creating default .gitignore...
    (
    echo # Dependencies
    echo node_modules/
    echo */node_modules/
    echo.
    echo # Build outputs
    echo dist/
    echo build/
    echo */dist/
    echo */build/
    echo.
    echo # Environment files
    echo .env
    echo .env.local
    echo .env.production
    echo backend/.env
    echo.
    echo # Logs
    echo logs/
    echo *.log
    ) > .gitignore
    echo ✅ .gitignore created
    echo.
)

echo 📊 Current status:
git status
echo.

echo ========================================
echo.
echo Ready to commit and push!
echo.
echo ⚠️  IMPORTANT: Make sure you have:
echo    1. Removed any sensitive data (.env files)
echo    2. Tested the application locally
echo    3. Updated documentation
echo.

choice /C YN /M "Do you want to continue with commit and push"
if errorlevel 2 (
    echo.
    echo ❌ Push cancelled
    pause
    exit /b 0
)

echo.
echo 📦 Adding all files...
git add .

echo.
echo 💬 Enter commit message (or press Enter for default):
set /p COMMIT_MSG="Message: "

if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=Initial commit - Complete Obedio Yacht Crew Management System"
)

echo.
echo 📝 Committing with message: "%COMMIT_MSG%"
git commit -m "%COMMIT_MSG%"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ⚠️  Nothing to commit or commit failed
    echo    Check git status for more info
    pause
    exit /b 1
)

echo.
echo 🚀 Pushing to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  ✅ SUCCESSFULLY PUSHED TO GITHUB!
    echo ========================================
    echo.
    echo 🌐 Repository: %REPO_URL%
    echo.
    echo 📝 Next steps:
    echo    1. Visit your GitHub repository
    echo    2. Check that all files are there
    echo    3. Update repository description
    echo    4. Add topics/tags
    echo.
) else (
    echo.
    echo ❌ Push failed!
    echo.
    echo Possible reasons:
    echo    - Not authenticated with GitHub
    echo    - Network issue
    echo    - Repository doesn't exist
    echo.
    echo 💡 Try:
    echo    git push -u origin main
    echo.
)

pause
