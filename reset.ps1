# ========================================
# OBEDIO - COMPLETE RESET
# ========================================
# Resetuje sve: zaustavi servere, obriše cache, reinstaliraj pakete

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "♻️  OBEDIO - Complete Reset" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Step 1: Stop all servers
Write-Host "1️⃣  Stopping all servers..." -ForegroundColor Yellow
Write-Host ""

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
        Write-Host "   ⏹️  Stopping process ID: $($process.Id)" -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ Servers stopped!" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  No servers running." -ForegroundColor Cyan
}

Write-Host ""

# Step 2: Clean node_modules and package-lock
Write-Host "2️⃣  Cleaning dependencies..." -ForegroundColor Yellow
Write-Host ""

$foldersToDelete = @(
    "node_modules",
    "backend\node_modules",
    ".vite",
    "backend\dist"
)

foreach ($folder in $foldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "   🗑️  Deleting $folder..." -ForegroundColor Gray
        Remove-Item -Path $folder -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Deleted $folder" -ForegroundColor Green
    }
}

Write-Host ""

# Step 3: Reinstall dependencies
Write-Host "3️⃣  Reinstalling dependencies..." -ForegroundColor Yellow
Write-Host ""

# Backend
Write-Host "   📦 Installing backend packages..." -ForegroundColor Cyan
Set-Location backend
npm install --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Backend packages installed!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend installation failed!" -ForegroundColor Red
}
Set-Location ..

Write-Host ""

# Frontend
Write-Host "   📦 Installing frontend packages..." -ForegroundColor Cyan
npm install --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Frontend packages installed!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend installation failed!" -ForegroundColor Red
}

Write-Host ""

# Step 4: Database migrations (if needed)
Write-Host "4️⃣  Running database migrations..." -ForegroundColor Yellow
Write-Host ""

Set-Location backend
npx prisma generate --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma client generated!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Prisma generate had issues (might be OK)" -ForegroundColor Yellow
}
Set-Location ..

Write-Host ""

# Step 5: Instructions for localStorage clear
Write-Host "5️⃣  Browser localStorage..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   ⚠️  VAŽNO: Otvori browser DevTools (F12) i:" -ForegroundColor Yellow
Write-Host "   → Console → localStorage.clear()" -ForegroundColor Cyan
Write-Host "   → Ili idi na Application tab → Clear storage → Clear site data" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Reset Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Sledeći korak:" -ForegroundColor Cyan
Write-Host "   1. Pokreni servere: .\start.ps1" -ForegroundColor White
Write-Host "   2. Očisti localStorage u browser-u (F12)" -ForegroundColor White
Write-Host "   3. Refresh stranicu (Ctrl + F5)" -ForegroundColor White
Write-Host "   4. Login: admin / admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
