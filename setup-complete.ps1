# TrackerApp Setup Automation Script
# This script automates the initial setup of the TrackerApp project

param(
    [string]$ProjectPath = ".",
    [switch]$SkipDeps = $false,
    [switch]$DevMode = $false
)

Write-Host "TrackerApp Setup Automation" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to create environment file
function New-EnvFile {
    param($Path, $Content)
    
    if (Test-Path $Path) {
        Write-Host "$Path already exists, skipping..." -ForegroundColor Yellow
        return
    }
    
    Write-Host "Creating $Path..." -ForegroundColor Green
    $Content | Out-File -FilePath $Path -Encoding UTF8
}

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Blue

$missingDeps = @()

if (-not (Test-Command "node")) {
    $missingDeps += "Node.js"
}

if (-not (Test-Command "npm")) {
    $missingDeps += "npm"
}

if (-not (Test-Command "git")) {
    $missingDeps += "Git"
}

if ($missingDeps.Count -gt 0) {
    Write-Host "Missing dependencies: $($missingDeps -join ', ')" -ForegroundColor Red
    Write-Host "Please install the missing dependencies and run this script again." -ForegroundColor Red
    exit 1
}

Write-Host "All prerequisites found!" -ForegroundColor Green

# Set up project directories
$backendPath = Join-Path $ProjectPath "Website\backend"
$frontendPath = Join-Path $ProjectPath "Website\frontend"
$mobilePath = Join-Path $ProjectPath "MobileApp"

# Backend setup
Write-Host "`nSetting up Backend..." -ForegroundColor Blue

if (Test-Path $backendPath) {
    Push-Location $backendPath
    # Create .env file
    $backendEnv = @'
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/trackerapp

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production

# Cloudinary Configuration (Register at cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
'@
    New-EnvFile ".env" $backendEnv
    if (-not $SkipDeps) {
        Write-Host "Installing backend dependencies..." -ForegroundColor Green
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to install backend dependencies" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    Pop-Location
    Write-Host "Backend setup complete!" -ForegroundColor Green
} else {
    Write-Host "Backend directory not found: $backendPath" -ForegroundColor Yellow
}

# Frontend setup
Write-Host "`nSetting up Frontend..." -ForegroundColor Blue

if (Test-Path $frontendPath) {
    Push-Location $frontendPath
    # Create .env file
    $frontendEnv = @'
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=TrackerApp
VITE_APP_VERSION=1.0.0

# Debug Mode
VITE_DEBUG=true

# Map Configuration (Optional - for enhanced maps)
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
'@
    New-EnvFile ".env" $frontendEnv
    if (-not $SkipDeps) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Green
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    Pop-Location
    Write-Host "Frontend setup complete!" -ForegroundColor Green
} else {
    Write-Host "Frontend directory not found: $frontendPath" -ForegroundColor Yellow
}

# Mobile App setup
Write-Host "`nSetting up Mobile App..." -ForegroundColor Blue

if (Test-Path $mobilePath) {
    Push-Location $mobilePath
    # Create .env file
    $mobileEnv = @'
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000

# App Configuration
EXPO_PUBLIC_APP_NAME=TrackerApp
EXPO_PUBLIC_APP_VERSION=1.0.0

# Debug Configuration
EXPO_DEBUG=true

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_CRASHLYTICS=false

# Push Notifications (Optional)
EXPO_PUBLIC_PUSH_ENDPOINT=your_push_endpoint
'@
    New-EnvFile ".env" $mobileEnv
    if (-not $SkipDeps) {
        Write-Host "Installing mobile app dependencies..." -ForegroundColor Green
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to install mobile app dependencies" -ForegroundColor Red
            Pop-Location
            exit 1
        }
    }
    Pop-Location
    Write-Host "Mobile app setup complete!" -ForegroundColor Green
} else {
    Write-Host "Mobile app directory not found: $mobilePath" -ForegroundColor Yellow
}

# Check for Expo CLI
if (-not (Test-Command "expo")) {
    Write-Host "`nInstalling Expo CLI..." -ForegroundColor Blue
    npm install -g @expo/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Expo CLI globally. You may need to install it manually:" -ForegroundColor Yellow
        Write-Host "   npm install -g @expo/cli" -ForegroundColor Yellow
    } else {
        Write-Host "Expo CLI installed!" -ForegroundColor Green
    }
}

# Create development scripts
Write-Host "`nCreating development scripts..." -ForegroundColor Blue

$startAllScript = @"
# Start All Services Script
Write-Host "🚀 Starting TrackerApp Development Environment" -ForegroundColor Cyan

# Start Backend
Write-Host "`n🔧 Starting Backend Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting Frontend Development Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

# Start Mobile App
Write-Host "📱 Starting Mobile App Development Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mobilePath'; npm start"

Write-Host "`n✅ All services started!" -ForegroundColor Green
Write-Host "📝 Check the opened terminals for server status" -ForegroundColor Yellow
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📱 Mobile: Follow Expo CLI instructions" -ForegroundColor Cyan
"@

$startAllScript | Out-File -FilePath (Join-Path $ProjectPath "start-all.ps1") -Encoding UTF8

$stopAllScript = @"
# Stop All Services Script
Write-Host "🛑 Stopping TrackerApp Development Environment" -ForegroundColor Red

# Kill processes by port
Write-Host "Stopping services on ports 3000, 5000..." -ForegroundColor Yellow

try {
    # Stop frontend (port 3000)
    $frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($frontend) {
        Stop-Process -Id $frontend.OwningProcess -Force
        Write-Host "✅ Frontend stopped" -ForegroundColor Green
    }
    
    # Stop backend (port 5000)
    $backend = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($backend) {
        Stop-Process -Id $backend.OwningProcess -Force
        Write-Host "✅ Backend stopped" -ForegroundColor Green
    }
    
    # Stop Expo/Metro bundler
    Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*expo*" -or $_.CommandLine -like "*metro*" } | Stop-Process -Force
    Write-Host "✅ Mobile development server stopped" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️  Some processes may still be running. Check manually if needed." -ForegroundColor Yellow
}

Write-Host "🛑 All services stopped!" -ForegroundColor Red
"@

$stopAllScript | Out-File -FilePath (Join-Path $ProjectPath "stop-all.ps1") -Encoding UTF8

Write-Host "Development scripts created!" -ForegroundColor Green

# Create README for quick start
$quickStartReadme = @"
# TrackerApp - Quick Start Guide

## 🚀 Development Environment

### Prerequisites Installed
- ✅ Node.js and npm
- ✅ Git
- ✅ Project dependencies

### Quick Commands

#### Start All Services
``````powershell
.\start-all.ps1
``````

#### Stop All Services
``````powershell
.\stop-all.ps1
``````

### Individual Services

#### Backend Only
``````bash
cd Website/backend
npm start
``````

#### Frontend Only
``````bash
cd Website/frontend
npm run dev
``````

#### Mobile App Only
``````bash
cd MobileApp
npm start
``````

### 🔧 Configuration

1. **Backend**: Edit `Website/backend/.env`
   - Set up MongoDB connection
   - Configure Cloudinary for media storage
   - Set up email credentials for notifications

2. **Frontend**: Edit `Website/frontend/.env`
   - Verify API URL matches backend

3. **Mobile**: Edit `MobileApp/.env`
   - Verify API URL matches backend

### 🌐 Access Points

- **Web Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health
- **Mobile App**: Follow Expo CLI instructions

### 📱 Mobile Development

#### Android
``````bash
cd MobileApp
npm run android
``````

#### iOS (macOS only)
``````bash
cd MobileApp
npm run ios
``````

### 🗄️ Database Setup

#### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Database will be created automatically

#### MongoDB Atlas (Cloud)
1. Create account at mongodb.com
2. Create cluster and get connection string
3. Update MONGODB_URI in backend/.env

### 📸 Media Storage Setup

#### Cloudinary
1. Create account at cloudinary.com
2. Get Cloud Name, API Key, and API Secret
3. Update credentials in backend/.env

### 🚨 Troubleshooting

#### Port Already in Use
``````bash
# Kill processes on specific ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
``````

#### Mobile App Not Connecting
1. Check backend is running on port 5000
2. Verify API_URL in MobileApp/.env
3. Check firewall settings
4. Use actual IP address instead of localhost for physical devices

#### Database Connection Issues
1. Verify MongoDB is running
2. Check connection string in .env
3. Ensure network connectivity
4. Check firewall settings

### 📚 Documentation

- **Complete Guide**: See COMPLETE_IMPLEMENTATION_GUIDE.md
- **API Documentation**: http://localhost:5000/api-docs (when backend is running)
- **Feature Checklist**: See App/FEATURE_CHECKLIST.md

### 🆘 Support

- Check logs in terminal windows
- Review .env file configurations
- Ensure all prerequisites are installed
- Restart services if needed

**Happy Development! 🎉**
"@

$quickStartReadme | Out-File -FilePath (Join-Path $ProjectPath "QUICK_START.md") -Encoding UTF8

# Final setup summary
Write-Host "`nSetup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Configure environment variables in .env files" -ForegroundColor White
Write-Host "2. Set up MongoDB database" -ForegroundColor White
Write-Host "3. Configure Cloudinary for media storage" -ForegroundColor White
Write-Host "4. Run '.\start-all.ps1' to start all services" -ForegroundColor White

Write-Host "`nQuick Access:" -ForegroundColor Cyan
Write-Host "- Start All: .\start-all.ps1" -ForegroundColor White
Write-Host "- Stop All: .\stop-all.ps1" -ForegroundColor White
Write-Host "- Quick Guide: QUICK_START.md" -ForegroundColor White
Write-Host "- Complete Guide: COMPLETE_IMPLEMENTATION_GUIDE.md" -ForegroundColor White

Write-Host "`nService URLs (after starting):" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend: http://localhost:5000" -ForegroundColor White
Write-Host "- Health Check: http://localhost:5000/api/health" -ForegroundColor White

if ($DevMode) {
    Write-Host "`nStarting development environment..." -ForegroundColor Blue
    & (Join-Path $ProjectPath "start-all.ps1")
}

Write-Host "`nTrackerApp is ready for development!" -ForegroundColor Green
