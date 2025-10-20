@echo off
REM Setup script for creating .env file

echo Creating .env file from .env.example...

if exist .env (
    echo .env file already exists!
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 goto :end
)

(
echo # Obedio Yacht Crew Management - Environment Configuration
echo # Generated: %date% %time%
echo.
echo # ===== DATABASE CONFIGURATION =====
echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/obedio_yacht_crew"
echo.
echo # ===== SERVER CONFIGURATION =====
echo NODE_ENV=development
echo PORT=3001
echo HOST=0.0.0.0
echo.
echo # ===== FRONTEND CONFIGURATION =====
echo FRONTEND_URL=http://localhost:3000
echo.
echo # ===== AUTHENTICATION =====
echo JWT_SECRET=obedio-yacht-crew-super-secret-jwt-key-change-in-production-min-32-chars
echo JWT_EXPIRES_IN=7d
echo.
echo # ===== SECURITY =====
echo BCRYPT_ROUNDS=10
echo.
echo # ===== CORS =====
echo CORS_ORIGIN=http://localhost:3000,http://localhost:5173
echo.
echo # ===== LOGGING =====
echo LOG_LEVEL=info
echo.
) > .env

echo.
echo ✅ .env file created successfully!
echo.
echo ⚠️  IMPORTANT: Update the DATABASE_URL with your PostgreSQL credentials
echo    Current: postgresql://postgres:postgres@localhost:5432/obedio_yacht_crew
echo.
echo 📝 Edit .env file to customize settings before starting the server.
echo.

:end
