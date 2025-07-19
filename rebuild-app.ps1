#!/usr/bin/env pwsh

Write-Host "🔄 Rebuilding TrackerApp with updated permissions..." -ForegroundColor Yellow

# Navigate to MobileApp directory
Set-Location ".\MobileApp"

Write-Host "📱 Clearing Expo cache..." -ForegroundColor Cyan
npx expo r -c

Write-Host "🧹 Clearing node_modules and reinstalling..." -ForegroundColor Cyan
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

npm install

Write-Host "🎯 Starting Expo development server..." -ForegroundColor Green
Write-Host "After the server starts, you'll need to rebuild your app by:" -ForegroundColor Yellow
Write-Host "1. Pressing 'a' to run on Android" -ForegroundColor White
Write-Host "2. Or scanning the QR code with Expo Go app" -ForegroundColor White
Write-Host "3. The app will rebuild with the new permissions" -ForegroundColor White

npx expo start

# Return to original directory
Set-Location ".."
