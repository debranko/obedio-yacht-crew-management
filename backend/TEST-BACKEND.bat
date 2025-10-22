@echo off
echo ========================================
echo BACKEND API TESTING
echo ========================================
echo.

echo Testing Health Endpoint...
curl http://localhost:3001/api/health
echo.
echo.

echo Testing Locations Endpoint (requires auth)...
curl http://localhost:3001/api/locations -H "Authorization: Bearer YOUR_TOKEN_HERE"
echo.
echo.

echo Testing Guests Endpoint (requires auth)...
curl http://localhost:3001/api/guests -H "Authorization: Bearer YOUR_TOKEN_HERE"
echo.
echo.

echo Testing Service Requests Endpoint (requires auth)...
curl http://localhost:3001/api/service-requests -H "Authorization: Bearer YOUR_TOKEN_HERE"
echo.
echo.

pause
