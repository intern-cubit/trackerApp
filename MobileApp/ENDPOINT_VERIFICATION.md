# TrackerApp Mobile API Endpoints Verification

## ✅ **Verified API Endpoints**

### Base URL: `http://10.227.121.225:5000`

---

## 🔐 **Authentication Endpoints**
| Method | Endpoint | Purpose | Required Fields | Status |
|--------|----------|---------|----------------|--------|
| POST | `/api/auth/login` | User login | `identifier`, `password` | ✅ Fixed |
| POST | `/api/auth/signup` | User registration | `username`, `fullName`, `email`, `password` | ✅ Fixed |
| GET | `/api/auth/check-auth` | Verify token | Auth header | ✅ Available |
| POST | `/api/auth/forgot-password` | Password reset request | `email` | ✅ Available |
| POST | `/api/auth/reset-password` | Password reset | `token`, `password` | ✅ Available |

---

## 👤 **User Management Endpoints**
| Method | Endpoint | Purpose | Auth Required | Status |
|--------|----------|---------|---------------|--------|
| GET | `/api/user/trackers` | Get user's trackers | Yes | ✅ Available |
| POST | `/api/user/assign-tracker` | Assign tracker to user | Yes | ✅ Available |
| GET | `/api/user/trackers/:id/live` | Get live location | Yes | ✅ Available |
| POST | `/api/user/trackers/:id/history` | Get location history | Yes | ✅ Available |
| POST | `/api/user/trackers/:id/geo-location` | Update geofencing | Yes | ✅ Available |
| PUT | `/api/user/update-user` | Update user profile | Yes | ✅ Available |
| PUT | `/api/user/updatepassword` | Change password | Yes | ✅ Available |
| PUT | `/api/user/update-notifications` | Update notification settings | Yes | ✅ Available |

---

## 📱 **Device Management Endpoints**
| Method | Endpoint | Purpose | Auth Required | Status |
|--------|----------|---------|---------------|--------|
| GET | `/api/device/expiration-status` | Check device expiration | No | ✅ Available |
| POST | `/api/device/device-data` | Submit device data | No | ✅ Available |
| POST | `/api/device/location` | Submit location update | No | ✅ Available |
| POST | `/api/device/activation-status` | Check activation status | No | ✅ Available |

---

## 🔔 **Notification Endpoints**
| Method | Endpoint | Purpose | Auth Required | Status |
|--------|----------|---------|---------------|--------|
| GET | `/api/notifications` | Get notifications | Yes | ✅ Available |
| POST | `/api/notifications/mark-read` | Mark notifications as read | Yes | ✅ Available |

---

## 🛡️ **Security Endpoints**
| Method | Endpoint | Purpose | Auth Required | Status |
|--------|----------|---------|---------------|--------|
| GET | `/api/security/events/:deviceId` | Get security events | Yes | ✅ Available |
| POST | `/api/security/remote-lock/:deviceId` | Remote lock device | Yes | ✅ Available |
| POST | `/api/security/remote-unlock/:deviceId` | Remote unlock device | Yes | ✅ Available |
| POST | `/api/security/trigger-alarm/:deviceId` | Trigger security alarm | Yes | ✅ Available |
| POST | `/api/security/capture-media/:deviceId` | Capture media remotely | Yes | ✅ Available |

---

## 📸 **Media Endpoints**
| Method | Endpoint | Purpose | Auth Required | Status |
|--------|----------|---------|---------------|--------|
| POST | `/api/media/upload` | Upload media files | Yes | ✅ Available |
| GET | `/api/media/device/:deviceId` | Get device media | Yes | ✅ Available |
| DELETE | `/api/media/:mediaId` | Delete media file | Yes | ✅ Available |

---

## 🏥 **Health & Status**
| Method | Endpoint | Purpose | Auth Required | Status |
|--------|----------|---------|---------------|--------|
| GET | `/api/health` | Server health check | No | ✅ Verified |

---

## 🔧 **Fixed Issues**

### 1. **Authentication Parameter Mismatch**
- **Issue**: Mobile app was sending `email` + `password`
- **Backend Expected**: `identifier` + `password`
- **Fix**: Updated LoginScreen to send `identifier: email`

### 2. **Registration Parameter Mismatch**
- **Issue**: Mobile app was sending `name`, `email`, `password`
- **Backend Expected**: `username`, `fullName`, `email`, `password`
- **Fix**: Updated RegisterScreen to send correct parameters

### 3. **Wrong Endpoint URLs**
- **Issue**: Mobile app was using `localhost:5000`
- **Backend Running**: `10.227.121.225:5000`
- **Fix**: Updated all services to use centralized API configuration

### 4. **Registration Endpoint Path**
- **Issue**: Mobile app was using `/api/auth/register`
- **Backend Route**: `/api/auth/signup`
- **Fix**: Updated API_ENDPOINTS.REGISTER to use `/signup`

---

## 🎯 **Mobile App Integration Status**

### ✅ **Completed**
- API configuration centralized in `/src/config/api.js`
- LoginScreen uses correct parameters
- RegisterScreen uses correct parameters and endpoint
- SocketService uses correct base URL
- All localhost references removed

### 🔄 **Next Steps**
- Test login functionality with app
- Implement user tracker management
- Add security feature integration
- Implement media capture and upload

---

## 📝 **Test Credentials**
For testing, create a user through the mobile app registration or use existing backend users.

**Backend Health**: ✅ Confirmed running and accessible
**WebSocket**: ✅ Available for real-time features
**File Upload**: ✅ Configured with Cloudinary
**Database**: ✅ MongoDB connected
