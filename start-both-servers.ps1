#!/usr/bin/env pwsh
# Start Both Servers Script

Write-Host "🚀 Starting NCKH Survey System Servers..." -ForegroundColor Cyan
Write-Host ""

# Kill existing processes
Write-Host "🔄 Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Backend
Write-Host "📦 Starting Backend Server (Port 5000)..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd D:\NCKH\Backend; npm start" -WindowStyle Normal

Start-Sleep -Seconds 5

# Start Frontend  
Write-Host "🎨 Starting Frontend Server (Port 3000)..." -ForegroundColor Green
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd D:\NCKH\Frontend; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Servers starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this script (servers will keep running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
