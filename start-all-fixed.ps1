# Start All Services Script
Write-Host "Starting TrackerApp Development Environment" -ForegroundColor Cyan

# Start Backend
Write-Host "`nStarting Backend Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Website\backend'; npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Development Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'Website\frontend'; npm run dev"

# Start Mobile App
Write-Host "Starting Mobile App Development Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'MobileApp'; npm start"

Write-Host "`nAll services started!" -ForegroundColor Green
Write-Host "Check the opened terminals for server status" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Mobile: Follow Expo CLI instructions" -ForegroundColor Cyan
