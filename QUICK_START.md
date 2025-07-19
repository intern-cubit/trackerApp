# TrackerApp - Quick Start Guide

## ðŸš€ Development Environment

### Prerequisites Installed
- âœ… Node.js and npm
- âœ… Git
- âœ… Project dependencies

### Quick Commands

#### Start All Services
```powershell
.\start-all.ps1
```

#### Stop All Services
```powershell
.\stop-all.ps1
```

### Individual Services

#### Backend Only
```bash
cd Website/backend
npm start
```

#### Frontend Only
```bash
cd Website/frontend
npm run dev
```

#### Mobile App Only
```bash
cd MobileApp
npm start
```

### ðŸ”§ Configuration

1. **Backend**: Edit Website/backend/.env
   - Set up MongoDB connection
   - Configure Cloudinary for media storage
   - Set up email credentials for notifications

2. **Frontend**: Edit Website/frontend/.env
   - Verify API URL matches backend

3. **Mobile**: Edit MobileApp/.env
   - Verify API URL matches backend

### ðŸŒ Access Points

- **Web Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health
- **Mobile App**: Follow Expo CLI instructions

### ðŸ“± Mobile Development

#### Android
```bash
cd MobileApp
npm run android
```

#### iOS (macOS only)
```bash
cd MobileApp
npm run ios
```

### ðŸ—„ï¸ Database Setup

#### Local MongoDB
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Database will be created automatically

#### MongoDB Atlas (Cloud)
1. Create account at mongodb.com
2. Create cluster and get connection string
3. Update MONGODB_URI in backend/.env

### ðŸ“¸ Media Storage Setup

#### Cloudinary
1. Create account at cloudinary.com
2. Get Cloud Name, API Key, and API Secret
3. Update credentials in backend/.env

### ðŸš¨ Troubleshooting

#### Port Already in Use
```bash
# Kill processes on specific ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

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

### ðŸ“š Documentation

- **Complete Guide**: See COMPLETE_IMPLEMENTATION_GUIDE.md
- **API Documentation**: http://localhost:5000/api-docs (when backend is running)
- **Feature Checklist**: See App/FEATURE_CHECKLIST.md

### ðŸ†˜ Support

- Check logs in terminal windows
- Review .env file configurations
- Ensure all prerequisites are installed
- Restart services if needed

**Happy Development! ðŸŽ‰**
