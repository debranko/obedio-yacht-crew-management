@echo off
echo Testing User Preferences API...
echo.

REM Get auth token (admin user)
echo 1. Getting auth token...
for /f "tokens=*" %%i in ('curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}" ^| powershell -Command "$input | ConvertFrom-Json | Select -ExpandProperty token"') do set TOKEN=%%i
echo Token obtained: %TOKEN:~0,20%...
echo.

REM Get current preferences
echo 2. Getting current preferences...
curl -X GET http://localhost:8080/api/user-preferences -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"
echo.
echo.

REM Update dashboard preferences
echo 3. Updating dashboard preferences...
curl -X PUT http://localhost:8080/api/user-preferences/dashboard -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"dashboardLayout\":[{\"i\":\"test\",\"x\":0,\"y\":0,\"w\":4,\"h\":4}],\"activeWidgets\":[\"test-widget\"]}"
echo.
echo.

REM Get updated preferences
echo 4. Getting updated preferences...
curl -X GET http://localhost:8080/api/user-preferences -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json"
echo.
echo.

echo Test complete!
pause