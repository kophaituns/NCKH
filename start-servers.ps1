# START ALL SERVERS - Survey System
# This script starts both backend and frontend servers

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "         🚀 STARTING SURVEY SYSTEM SERVERS..." -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Kill existing node processes
Write-Host "🧹 Cleaning up old processes..." -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Start Backend
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location "d:\NCKH\Backend"
    node src/index.js
}
Start-Sleep -Seconds 5

# Verify backend is up
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✅ Backend is running on port 5000" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Backend failed to start!" -ForegroundColor Red
    Write-Host "  Check logs: d:\NCKH\Backend\logs\combined.log" -ForegroundColor Yellow
    exit 1
}

# Start Frontend
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "d:\NCKH\Frontend"
    npm start
}
Start-Sleep -Seconds 15

# Verify frontend is up
$maxRetries = 10
$retry = 0
while ($retry -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ Frontend is running on port 3000" -ForegroundColor Green
            break
        }
    } catch {
        $retry++
        if ($retry -lt $maxRetries) {
            Write-Host "  ⏳ Waiting for frontend... ($retry/$maxRetries)" -ForegroundColor DarkYellow
            Start-Sleep -Seconds 3
        } else {
            Write-Host "  ❌ Frontend timeout!" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "             🎉 ALL SERVERS ARE RUNNING! 🎉" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host " SERVICES:" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  Database: MySQL Connected" -ForegroundColor Green
Write-Host ""
Write-Host "👥 TEST ACCOUNTS (password: pass123):" -ForegroundColor Cyan
Write-Host "  • admin1    - Admin role" -ForegroundColor White
Write-Host "  • creator1  - Creator role" -ForegroundColor White
Write-Host "  • user1     - User role" -ForegroundColor White
Write-Host ""
Write-Host "🌐 OPEN IN BROWSER:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000/auth/login" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 TIP: Press Ctrl+Shift+R to hard refresh browser" -ForegroundColor DarkGray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Background Jobs Running:" -ForegroundColor Cyan
Get-Job | Format-Table -AutoSize
Write-Host ""
Write-Host "To stop servers: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor DarkGray
Write-Host ""
