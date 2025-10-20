@echo off
echo ========================================
echo  OBEDIO YACHT CREW - COMPLETE SETUP
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo    Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version
echo.

REM Check if PostgreSQL is running
echo Checking PostgreSQL connection...
psql --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  PostgreSQL CLI not found in PATH
    echo    Make sure PostgreSQL is installed and running
    echo.
)

echo.
echo ========================================
echo  STEP 1: Setup Backend
echo ========================================
echo.

cd backend

REM Create .env file
if not exist .env (
    echo Creating .env file...
    call setup-env.bat
) else (
    echo ✅ .env file already exists
)

echo.
echo Installing backend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Generating Prisma Client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to generate Prisma Client
    pause
    exit /b 1
)

echo.
echo Pushing database schema...
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to push database schema
    echo    Make sure PostgreSQL is running and DATABASE_URL in .env is correct
    pause
    exit /b 1
)

echo.
echo Seeding database with mock data...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to seed database
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo  STEP 2: Setup Frontend
echo ========================================
echo.

echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ✅ SETUP COMPLETE!
echo ========================================
echo.
echo 📊 Database Summary:
cd backend
call npx prisma db --version >nul 2>&1

echo.
echo 🚀 To start the application:
echo.
echo    1. Start Backend (in this terminal):
echo       cd backend
echo       npm run dev
echo.
echo    2. Start Frontend (in new terminal):
echo       npm run dev
echo.
echo 🔑 Login Credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:3001
echo    Health:   http://localhost:3001/api/health
echo.

cd ..
pause
