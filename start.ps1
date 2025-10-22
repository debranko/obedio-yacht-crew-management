# ========================================
# OBEDIO - START DEVELOPMENT SERVERS
# ========================================
# Pokretanje backend i frontend servera

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 OBEDIO - Starting Development Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if backend and frontend folders exist
if (-not (Test-Path "backend")) {
    Write-Host "❌ Backend folder not found!" -ForegroundColor Red
    exit 1
}

# Check if node_modules exist
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "✅ Dependencies OK!" -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "🟢 Starting Backend Server (Port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; Write-Host '🔧 BACKEND SERVER' -ForegroundColor Cyan; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🟢 Starting Frontend Server (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; Write-Host '💻 FRONTEND SERVER' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Servers are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "💻 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Sačekaj 5-10 sekundi pa otvori browser!" -ForegroundColor Yellow
Write-Host "💡 Tip: Za zaustavljanje: stop.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
