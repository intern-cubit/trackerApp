# Remote Photo/Video Capture Feature - Implementation Guide

## Overview
The remote photo/video capture feature allows users to control the mobile device's camera remotely from the web dashboard. When a user clicks the capture buttons on the website, the mobile app receives commands through WebSocket connections and automatically opens the camera to take photos or record videos.

## Features Implemented

### 1. Backend Implementation
- **Socket Events**: Added remote command handling in `backend/index.js`
  - `remote-capture-command`: Receives commands from dashboard
  - `command-ack`: Receives acknowledgments from mobile device
  - `media-captured`: Receives media capture notifications

- **Device Command Model**: Uses existing `DeviceCommand` model to track command status
- **Media Upload**: Enhanced existing media upload route in `mediaRoutes.js`

### 2. Mobile App Implementation
- **Enhanced MediaScreen**: Complete redesign with remote command support
  - Real-time camera preview
  - Remote command indicators
  - Manual and remote capture modes
  - Connection status display

- **MediaCaptureService**: Enhanced service for media operations
  - Remote photo capture
  - Remote video recording with duration control
  - Automatic gallery saving
  - Cloud upload functionality

- **Socket Integration**: Remote command listeners in mobile app
  - `capture-photo`: Takes photo remotely
  - `start-video`: Starts video recording
  - `stop-video`: Stops video recording

### 3. Dashboard Implementation
- **RemoteControlPanel**: New component for remote media control
  - Photo capture button
  - Video recording with duration selection
  - Real-time command status
  - Connection monitoring

- **Sidebar Integration**: Added remote control section
  - Always visible with online/offline status
  - Disabled state when device is offline
  - Visual feedback for device status

## How to Test

### Prerequisites
1. Backend server running on port 5000
2. Frontend running on port 5174
3. Mobile app running on Expo
4. MongoDB database connected
5. Device registered and authenticated

### Testing Steps

#### 1. Setup
```bash
# Start Backend
cd Website/backend
npm start

# Start Frontend (in new terminal)
cd Website/frontend
npm run dev

# Start Mobile App (in new terminal)
cd MobileApp
npx expo start
```

#### 2. Device Registration
1. Register a device on the mobile app
2. Login to the web dashboard
3. Verify device appears in sidebar with status

#### 3. Remote Photo Capture
1. Open mobile app and go to Media screen
2. Ensure camera permissions are granted
3. On web dashboard, click "Media Control" button
4. Click "Capture Photo" in the remote control panel
5. Watch mobile app automatically open camera and take photo
6. Verify photo is saved to gallery and uploaded to cloud

#### 4. Remote Video Recording
1. In remote control panel, select recording duration (10s, 15s, 30s, 1min)
2. Click "Start Recording"
3. Watch mobile app start recording automatically
4. Video stops automatically after duration
5. Verify video is saved and uploaded

#### 5. Status Monitoring
- Command status updates appear in real-time
- Connection status shows device online/offline state
- Error messages display if device is unavailable

## Current Status

### ✅ Completed Features
- [x] Backend socket command handling
- [x] Mobile app remote command processing
- [x] Camera integration with remote control
- [x] Automatic media saving to gallery
- [x] Cloud upload functionality
- [x] Dashboard remote control interface
- [x] Real-time status updates
- [x] Error handling and user feedback

### 🎯 Testing Required
- [ ] End-to-end remote photo capture
- [ ] End-to-end remote video recording
- [ ] Socket connection stability
- [ ] Media file upload verification
- [ ] Cross-platform compatibility (iOS/Android)

### 🔧 Potential Enhancements
- [ ] Live camera preview on dashboard
- [ ] Multiple photo burst mode
- [ ] Video streaming capabilities
- [ ] Advanced camera settings (zoom, flash, etc.)
- [ ] Scheduled captures
- [ ] GPS location tagging

## Architecture

```
Dashboard (React)
    ↓ Socket.IO
Backend (Node.js/Express)
    ↓ Socket.IO
Mobile App (React Native/Expo)
    ↓ Expo Camera API
Device Camera
    ↓ Media Library API
Device Gallery
    ↓ Cloudinary API
Cloud Storage
```

## Security Considerations
- Commands are authenticated through JWT tokens
- Device ownership is verified before sending commands
- Media files are uploaded to secure cloud storage
- Socket connections are authenticated and encrypted

## Troubleshooting

### Common Issues
1. **Device shows offline**: Check mobile app is running and connected to internet
2. **Camera permissions denied**: Grant camera and media library permissions in mobile app
3. **Commands not working**: Verify socket connection status in both dashboard and mobile app
4. **Upload failures**: Check Cloudinary configuration and network connectivity

### Debug Information
- Backend logs show socket connections and command processing
- Mobile app logs show command reception and camera operations
- Dashboard shows real-time command status and responses
