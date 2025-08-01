# Enhanced Security Features Testing Guide

## 🚀 Testing Options for Enhanced Security Features

### 1. Expo Go Testing (Recommended for Development)
**Features that work in Expo Go:**
- ✅ Auto-lock after failed attempts
- ✅ Movement detection (accelerometer/gyroscope)
- ✅ Performance booster
- ✅ Basic app protection alerts
- ✅ Remote commands via socket
- ✅ Biometric authentication
- ✅ Audio alarms and notifications

**How to test with Expo Go:**
```bash
cd MobileApp
npm install expo-file-system
expo start
```
Scan QR code with Expo Go app on your phone.

### 2. Expo Development Build (For Advanced Features)
**Additional features available:**
- ✅ USB lock detection
- ✅ Enhanced screen lock override
- ✅ Better app usage monitoring
- ⚠️ Limited uninstall prevention

**Setup development build:**
```bash
npm install -g @expo/cli
expo install expo-dev-client
eas build --profile development --platform android
```

### 3. Standalone App Build (Full Feature Set)
**Features requiring device admin permissions:**
- ✅ Complete USB lock
- ✅ Full app protection and blocking
- ✅ Uninstall prevention (with device admin)
- ✅ Remote factory reset
- ✅ System-level screen lock override

## 📱 Feature Testing Instructions

### Auto-Lock After Failed Attempts
1. Go to **Enhanced Security** tab
2. Enable "Auto-Lock After Failed Attempts"
3. Set max attempts to 2 (for testing)
4. Use the test button "Test Auto-Lock" in development mode
5. **Expected Result**: Device locks, alarm plays, security photo captured

### Movement Lock
1. Enable "Movement Detection Lock"
2. Set threshold to 1.5 (sensitive for testing)
3. Shake the device vigorously
4. **Expected Result**: Movement lock triggered, alarm plays

### USB Lock
1. Enable "USB Lock"
2. Connect device to computer via USB
3. Select "File Transfer" mode
4. **Expected Result**: Lock triggered, security alert sent

### Performance Booster
1. Enable "Performance Booster"
2. Tap "Boost Performance Now"
3. **Expected Result**: Cache cleared, optimization report shown

### App Lock
1. Enable "App Lock"
2. Try to open Settings app (if device admin enabled)
3. **Expected Result**: Access blocked with authentication prompt

### Remote Factory Reset
1. Enable "Remote Factory Reset" (⚠️ DANGEROUS)
2. From dashboard, send factory reset command
3. **Expected Result**: Confirmation dialog, requires biometric auth

## 🧪 Development Testing Features

In development mode (`__DEV__ = true`), you get additional testing tools:

### Test Modal Access
- Tap "Security Testing (Dev Only)" button
- Manually trigger any security feature
- Test without waiting for real conditions

### Test Commands Available:
```javascript
// Manual testing in console
EnhancedSecurityService.triggerTestAutoLock()
EnhancedSecurityService.triggerTestMovementLock()
EnhancedSecurityService.triggerTestUSBLock()
EnhancedSecurityService.triggerTestPerformanceBoost()
```

## 🔧 Testing Scenarios

### Scenario 1: Basic Security Testing (Expo Go)
1. Install dependencies: `npm install`
2. Start Expo: `expo start`
3. Test auto-lock and movement detection
4. Verify alerts and socket communications

### Scenario 2: Advanced Testing (Development Build)
1. Create development build with EAS
2. Install on device with development build
3. Test USB detection and enhanced app protection
4. Verify device admin features (limited)

### Scenario 3: Production Testing (Standalone Build)
1. Build APK with full permissions
2. Install and grant device admin permissions
3. Test complete feature set including:
   - Full USB blocking
   - App uninstall prevention
   - System-level controls

## ⚠️ Testing Warnings & Limitations

### Expo Go Limitations:
- ❌ Cannot access system-level permissions
- ❌ Limited USB detection capabilities
- ❌ Cannot prevent app uninstallation
- ❌ Limited device admin features

### Development Build Limitations:
- ⚠️ Some device admin features require manual permission grants
- ⚠️ USB detection may be limited
- ⚠️ Factory reset testing should be done carefully

### Production Build Considerations:
- 🚨 Factory reset will actually reset the device
- 🚨 Uninstall prevention requires device admin setup
- 🚨 Some features may require root access for full functionality

## 📋 Testing Checklist

### ✅ Basic Features (Expo Go Compatible)
- [ ] Auto-lock after failed attempts
- [ ] Movement detection and locking
- [ ] Performance booster execution
- [ ] Remote lock/unlock via dashboard
- [ ] Audio alarm functionality
- [ ] Security photo capture
- [ ] Socket communication for alerts

### ✅ Advanced Features (Development Build)
- [ ] USB connection detection
- [ ] Enhanced screen lock behavior
- [ ] App usage monitoring
- [ ] Biometric authentication flows
- [ ] Performance optimization metrics

### ✅ Production Features (Standalone Build)
- [ ] Complete USB blocking
- [ ] App uninstall prevention
- [ ] Full device admin capabilities
- [ ] Remote factory reset (TEST CAREFULLY)
- [ ] System-level app blocking

## 🔗 Dashboard Integration Testing

### Test Remote Commands:
1. **Remote Lock**: Send lock command from dashboard
2. **Remote Unlock**: Send unlock command from dashboard
3. **Settings Update**: Update security settings remotely
4. **Factory Reset**: Send reset command (BE CAREFUL)

### Verify Alert Delivery:
1. Check dashboard receives security alerts
2. Verify email notifications are sent
3. Confirm socket events are properly transmitted

## 🚨 Important Safety Notes

1. **Factory Reset Testing**: Only test on development devices
2. **Device Admin**: Carefully manage device admin permissions
3. **USB Lock**: May interfere with development workflow
4. **Movement Lock**: Disable when not testing to avoid accidental locks
5. **Auto-Lock**: Keep max attempts reasonable to avoid lockouts

## 🐛 Troubleshooting

### Common Issues:
1. **Permissions denied**: Check app.json permissions
2. **Features not working**: Verify service initialization
3. **Socket connection failed**: Check backend server
4. **Biometric not working**: Ensure device has biometric setup

### Debug Commands:
```javascript
// Check service status
console.log(EnhancedSecurityService.getSecuritySettings())

// Check initialization
console.log(EnhancedSecurityService.isInitialized)

// View security events
console.log(await AsyncStorage.getItem('enhancedSecuritySettings'))
```

This comprehensive testing approach ensures you can develop and verify all security features across different deployment scenarios!
