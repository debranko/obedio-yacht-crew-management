@echo off
echo ======================================
echo Obedio Yacht Crew Management System
echo Windows Service Setup
echo ======================================

echo.
echo Installing dependencies...
call npm install --production

echo.
echo Building application...
call npm run build

echo.
echo Setting up database...
call npm run db:push
call npm run db:seed

echo.
echo Installing PM2 globally...
call npm install -g pm2
call npm install -g pm2-windows-service

echo.
echo Installing PM2 as Windows service...
call pm2-service-install

echo.
echo Starting Obedio backend service...
call pm2 start ecosystem.config.js --env production
call pm2 save

echo.
echo ======================================
echo ✅ Obedio Backend Setup Complete!
echo ======================================
echo.
echo 🌐 Server Access:
echo    • Local: http://localhost:3001
echo    • Network: http://%COMPUTERNAME%:3001
echo.
echo 🔧 Management:
echo    • PM2 Dashboard: pm2 monit
echo    • View Logs: pm2 logs obedio-backend
echo    • Restart: pm2 restart obedio-backend
echo    • Stop: pm2 stop obedio-backend
echo.
echo 🔑 Default Login:
echo    • Username: admin
echo    • Password: admin123
echo.
echo Press any key to exit...
pause >nul