# STOP ALL SERVERS - Survey System
# This script stops all running backend and frontend servers

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "         🛑 STOPPING ALL SURVEY SYSTEM SERVERS..." -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""

# Stop PowerShell background jobs
Write-Host "🧹 Stopping background jobs..." -ForegroundColor Cyan
$jobs = Get-Job -ErrorAction SilentlyContinue
if ($jobs) {
    $jobs | Stop-Job
    $jobs | Remove-Job
    Write-Host "  ✅ Stopped $($jobs.Count) background job(s)" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No background jobs found" -ForegroundColor DarkGray
}

# Kill all node processes
Write-Host "🧹 Stopping all Node.js processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "  ✅ Stopped $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  No Node.js processes found" -ForegroundColor DarkGray
}

Start-Sleep -Seconds 2

# Verify ports are freed
Write-Host ""
Write-Host "🔍 Checking ports..." -ForegroundColor Cyan
$port5000 = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if (-not $port5000) {
    Write-Host "  ✅ Port 5000 is free (Backend stopped)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Port 5000 is still in use" -ForegroundColor Yellow
}

if (-not $port3000) {
    Write-Host "  ✅ Port 3000 is free (Frontend stopped)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Port 3000 is still in use" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host "             ✅ ALL SERVERS STOPPED!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
Write-Host ""
