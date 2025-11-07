# Restart Frontend Dev Server
Write-Host "🔄 Restarting Frontend Development Server..." -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes running on port 3000
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    Write-Host "Stopping existing process on port 3000..." -ForegroundColor Yellow
    foreach ($p in $processes) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# Navigate to Frontend directory
Set-Location "d:\NCKH\Frontend"

Write-Host "✨ Starting React development server..." -ForegroundColor Green
Write-Host "   URL: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the dev server
npm start
