# ========================================
# OBEDIO - STOP DEVELOPMENT SERVERS
# ========================================
# Zaustavljanje svih backend i frontend servera

Write-Host "========================================" -ForegroundColor Red
Write-Host "🛑 OBEDIO - Stopping Development Servers" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

# Get all Node.js processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "🔍 Found $($nodeProcesses.Count) Node.js process(es)..." -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($process in $nodeProcesses) {
        Write-Host "⏹️  Stopping process ID: $($process.Id)" -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    # Wait a bit
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "✅ All Node.js processes stopped!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Node.js processes running." -ForegroundColor Cyan
}

# Also try to kill processes on specific ports (3001, 5173)
Write-Host ""
Write-Host "🔍 Checking ports 3001 and 5173..." -ForegroundColor Yellow

$ports = @(3001, 5173)
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port" | Select-String "LISTENING"
    
    if ($connections) {
        foreach ($conn in $connections) {
            $parts = $conn -split '\s+' | Where-Object { $_ -ne '' }
            $pid = $parts[-1]
            
            if ($pid -match '^\d+$') {
                Write-Host "⏹️  Stopping process on port $port (PID: $pid)" -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "✅ Port $port cleared!" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Port $port is free." -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ All servers stopped!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
