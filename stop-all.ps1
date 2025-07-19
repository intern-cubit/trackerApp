# Stop All Services Script
Write-Host "ðŸ›‘ Stopping TrackerApp Development Environment" -ForegroundColor Red

# Kill processes by port
Write-Host "Stopping services on ports 3000, 5000..." -ForegroundColor Yellow

try {
    # Stop frontend (port 3000)
     = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if () {
        Stop-Process -Id .OwningProcess -Force
        Write-Host "âœ… Frontend stopped" -ForegroundColor Green
    }
    
    # Stop backend (port 5000)
     = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if () {
        Stop-Process -Id .OwningProcess -Force
        Write-Host "âœ… Backend stopped" -ForegroundColor Green
    }
    
    # Stop Expo/Metro bundler
    Get-Process -Name "node" | Where-Object { .CommandLine -like "*expo*" -or .CommandLine -like "*metro*" } | Stop-Process -Force
    Write-Host "âœ… Mobile development server stopped" -ForegroundColor Green
    
} catch {
    Write-Host "âš ï¸  Some processes may still be running. Check manually if needed." -ForegroundColor Yellow
}

Write-Host "ðŸ›‘ All services stopped!" -ForegroundColor Red
