# ========================================
# OBEDIO - RESTART SERVERS
# ========================================
# Zaustavlja i ponovo pokreće servere

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "🔄 OBEDIO - Restarting Servers" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Step 1: Stop all servers
Write-Host "⏹️  Stopping servers..." -ForegroundColor Red
Write-Host ""

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "   Stopping process ID: $($process.Id)" -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host ""
    Write-Host "✅ Servers stopped!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No servers running." -ForegroundColor Cyan
}

Write-Host ""

# Also check ports
$ports = @(3001, 5173)
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port" | Select-String "LISTENING"
    
    if ($connections) {
        foreach ($conn in $connections) {
            $parts = $conn -split '\s+' | Where-Object { $_ -ne '' }
            $pid = $parts[-1]
            
            if ($pid -match '^\d+$') {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host ""

# Wait a bit
Write-Host "⏳ Waiting 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host ""

# Step 2: Start servers
Write-Host "🟢 Starting servers..." -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "📡 Starting Backend Server (Port 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; Write-Host '🔧 BACKEND SERVER' -ForegroundColor Cyan; npm run dev"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "💻 Starting Frontend Server (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; Write-Host '💻 FRONTEND SERVER' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Servers Restarted!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "💻 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Sačekaj 5-10 sekundi pa refreshuj browser!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
