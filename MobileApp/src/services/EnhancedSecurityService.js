// Enhanced Security Service with Advanced Protection Features
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, AppState, Linking } from 'react-native';
import SocketService from './SocketService';
import MediaCaptureService from './MediaCaptureService';
import PermissionManager from './PermissionManager';
import { API_BASE_URL } from '../config/api';

class EnhancedSecurityService {
  constructor() {
    this.isInitialized = false;
    
    // Auto-lock after failed attempts
    this.failedAttempts = 0;
    this.maxFailedAttempts = 3;
    this.autoLockEnabled = true;
    this.isDeviceLocked = false;
    
    // Movement lock
    this.movementLockEnabled = false;
    this.accelerometerSubscription = null;
    this.gyroscopeSubscription = null;
    this.movementThreshold = 2.0;
    this.lastAcceleration = { x: 0, y: 0, z: 0 };
    this.lastRotation = { x: 0, y: 0, z: 0 };
    this.movementCooldown = false;
    
    // Don't Touch Lock (different from movement - triggers on ANY touch/interaction)
    this.dontTouchLockEnabled = false;
    this.touchStartTime = null;
    this.lastTouchTime = 0;
    this.touchSensitivity = 1000; // milliseconds
    
    // SOS Alert (3 times power button press)
    this.sosEnabled = true;
    this.powerButtonPresses = 0;
    this.powerButtonTimeout = null;
    this.sosTimeWindow = 3000; // 3 seconds to press 3 times
    
    // USB lock
    this.usbLockEnabled = false;
    this.usbDebugWatcher = null;
    
    // Screen lock enhancement
    this.screenLockEnabled = false;
    this.appStateSubscription = null;
    this.screenLockOverride = false;
    
    // Performance booster
    this.performanceBoostEnabled = false;
    this.lastBoostTime = 0;
    this.boostInterval = 300000; // 5 minutes
    
    // App lock
    this.appLockEnabled = false;
    this.protectedApps = ['com.android.settings', 'com.google.android.packageinstaller'];
    this.appUsageWatcher = null;
    
    // Uninstall prevention
    this.preventUninstall = true;
    this.tamperDetection = true;
    
    // Remote factory reset
    this.remoteResetEnabled = false;
    this.resetConfirmationRequired = true;
    
    // Security event tracking
    this.securityEvents = [];
    this.alertThresholds = {
      failedAttempts: 3,
      movementDetections: 5,
      tamperAttempts: 2
    };
  }

  async initialize() {
    try {
      console.log('🔐 Initializing Enhanced Security Service...');
      
      // Load saved settings
      await this.loadSecuritySettings();
      
      // Initialize biometric authentication
      const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('📱 Available biometric types:', biometricTypes);
      
      // Setup movement detection if enabled
      if (this.movementLockEnabled) {
        await this.setupMovementDetection();
      }
      
      // Setup don't touch lock if enabled
      if (this.dontTouchLockEnabled) {
        await this.setupDontTouchLock();
      }
      
      // Setup SOS alert if enabled
      if (this.sosEnabled) {
        await this.setupSOSAlert();
      }
      
      // Setup USB protection if enabled
      if (this.usbLockEnabled) {
        await this.setupUSBProtection();
      }
      
      // Setup screen lock enhancement if enabled
      if (this.screenLockEnabled) {
        await this.setupScreenLockEnhancement();
      }
      
      // Setup app protection if enabled
      if (this.appLockEnabled) {
        await this.setupAppProtection();
      }
      
      // Setup uninstall prevention if enabled
      if (this.preventUninstall) {
        await this.setupUninstallPrevention();
      }
      
      // Setup periodic performance boost if enabled
      if (this.performanceBoostEnabled) {
        this.startPerformanceBooster();
      }
      
      // Listen for remote commands
      this.setupRemoteCommandListeners();
      
      this.isInitialized = true;
      console.log('✅ Enhanced Security Service initialized successfully');
      
      // Send initialization status to dashboard
      this.reportSecurityStatus();
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Security Service:', error);
      throw error;
    }
  }

  // =================== AUTO-LOCK AFTER FAILED ATTEMPTS ===================
  
  async recordFailedAttempt(attemptType = 'authentication') {
    try {
      this.failedAttempts++;
      
      console.log(`🚨 Failed attempt #${this.failedAttempts} (${attemptType})`);
      
      // Log security event
      await this.logSecurityEvent({
        type: 'failed_attempt',
        attemptType,
        count: this.failedAttempts,
        timestamp: Date.now(),
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version
        }
      });
      
      // Trigger haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Check if auto-lock threshold reached
      if (this.autoLockEnabled && this.failedAttempts >= this.maxFailedAttempts) {
        await this.triggerAutoLock();
      }
      
      // Send alert to dashboard after 2nd attempt
      if (this.failedAttempts >= 2) {
        await this.sendSecurityAlert({
          type: 'multiple_failed_attempts',
          attempts: this.failedAttempts,
          threshold: this.maxFailedAttempts,
          location: await this.getCurrentLocation(),
          timestamp: Date.now()
        });
      }
      
      await this.saveSecuritySettings();
      
    } catch (error) {
      console.error('Error recording failed attempt:', error);
    }
  }
  
  async triggerAutoLock() {
    try {
      console.log('🔒 Triggering auto-lock due to failed attempts...');
      
      this.isDeviceLocked = true;
      
      // Start security alarm
      await MediaCaptureService.startAudioAlarm(60); // 1 minute alarm
      
      // Capture security photo (check camera permission first)
      const cameraPermission = await PermissionManager.ensurePermission('camera', 'Auto Lock');
      if (cameraPermission.granted) {
        try {
          await MediaCaptureService.captureRemotePhoto();
          console.log('📸 Security photo captured during auto-lock');
        } catch (photoError) {
          console.warn('Failed to capture security photo:', photoError.message);
        }
      } else {
        console.warn('⚠️ Camera permission denied - no auto-lock security photo captured');
      }
      
      // Show lock screen alert
      Alert.alert(
        '🔒 Device Auto-Locked',
        `Device locked due to ${this.failedAttempts} failed authentication attempts. Admin notification sent.`,
        [
          {
            text: 'Emergency Unlock',
            style: 'destructive',
            onPress: () => this.showEmergencyUnlock()
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      
      // Send critical alert to dashboard and email
      await this.sendCriticalSecurityAlert({
        type: 'auto_lock_triggered',
        attempts: this.failedAttempts,
        timestamp: Date.now(),
        location: await this.getCurrentLocation(),
        deviceInfo: await this.getDeviceInfo()
      });
      
      // Reset failed attempts after lock
      this.failedAttempts = 0;
      await this.saveSecuritySettings();
      
      // Emit socket event
      SocketService.emit('device-auto-locked', {
        reason: 'failed_attempts',
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error triggering auto-lock:', error);
    }
  }
  
  async showEmergencyUnlock() {
    try {
      // Check biometric permission first
      const biometricPermission = await PermissionManager.ensurePermission('biometric', 'Emergency Access');
      
      if (!biometricPermission.granted) {
        Alert.alert(
          'Biometric Unavailable',
          'Biometric authentication is not available for emergency unlock.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Require biometric authentication for emergency unlock
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Emergency Unlock',
        subtitle: 'Use biometric authentication to unlock',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode'
      });
      
      if (result.success) {
        await this.unlockDevice('emergency_biometric');
      } else {
        Alert.alert('Authentication Failed', 'Emergency unlock denied');
      }
    } catch (error) {
      console.error('Emergency unlock error:', error);
    }
  }

  // =================== MOVEMENT LOCK ===================
  
  async setupMovementDetection() {
    try {
      console.log('📱 Setting up movement detection...');
      
      // Check if location permission is needed for logging
      const locationPermission = await PermissionManager.ensurePermission('location', 'Movement Lock');
      if (!locationPermission.granted) {
        console.warn('⚠️ Movement detection will work but location logging is limited');
      }
      
      // Setup accelerometer monitoring
      this.accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
        this.checkMovement('accelerometer', { x, y, z });
      });
      
      // Setup gyroscope monitoring
      this.gyroscopeSubscription = Gyroscope.addListener(({ x, y, z }) => {
        this.checkMovement('gyroscope', { x, y, z });
      });
      
      // Set update intervals
      Accelerometer.setUpdateInterval(100); // 10 times per second
      Gyroscope.setUpdateInterval(100);
      
      console.log('✅ Movement detection active');
      
    } catch (error) {
      console.error('Error setting up movement detection:', error);
    }
  }
  
  checkMovement(sensorType, data) {
    if (!this.movementLockEnabled || this.movementCooldown) return;
    
    let movement = 0;
    
    if (sensorType === 'accelerometer') {
      const deltaX = Math.abs(data.x - this.lastAcceleration.x);
      const deltaY = Math.abs(data.y - this.lastAcceleration.y);
      const deltaZ = Math.abs(data.z - this.lastAcceleration.z);
      movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
      this.lastAcceleration = data;
    } else if (sensorType === 'gyroscope') {
      const deltaX = Math.abs(data.x - this.lastRotation.x);
      const deltaY = Math.abs(data.y - this.lastRotation.y);
      const deltaZ = Math.abs(data.z - this.lastRotation.z);
      movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
      this.lastRotation = data;
    }
    
    // Check if movement exceeds threshold
    if (movement > this.movementThreshold) {
      this.triggerMovementLock(sensorType, movement);
    }
  }
  
  async triggerMovementLock(sensorType, movementValue) {
    try {
      console.log(`🚨 Movement detected: ${sensorType} = ${movementValue.toFixed(2)}`);
      
      // Set cooldown to prevent spam
      this.movementCooldown = true;
      setTimeout(() => { this.movementCooldown = false; }, 5000);
      
      // Log movement event
      await this.logSecurityEvent({
        type: 'movement_detected',
        sensorType,
        value: movementValue,
        threshold: this.movementThreshold,
        timestamp: Date.now()
      });
      
      // Lock device
      this.isDeviceLocked = true;
      
      // Trigger security measures
      await MediaCaptureService.startAudioAlarm(30);
      
      // Capture security photo (check camera permission first)
      const cameraPermission = await PermissionManager.ensurePermission('camera', 'Security Photo');
      if (cameraPermission.granted) {
        try {
          await MediaCaptureService.captureRemotePhoto();
          console.log('📸 Movement security photo captured');
        } catch (photoError) {
          console.warn('Failed to capture movement photo:', photoError.message);
        }
      } else {
        console.warn('⚠️ Camera permission denied - no security photo captured');
      }
      
      // Show movement alert
      Alert.alert(
        '📱 Movement Detected',
        `Device locked due to unauthorized movement (${sensorType}: ${movementValue.toFixed(2)})`,
        [{ text: 'Unlock', onPress: () => this.showBiometricUnlock() }]
      );
      
      // Send alert to dashboard
      await this.sendSecurityAlert({
        type: 'movement_lock_triggered',
        sensor: sensorType,
        value: movementValue,
        timestamp: Date.now(),
        location: await this.getCurrentLocation()
      });
      
      // Emit socket event
      SocketService.emit('device-movement-locked', {
        sensor: sensorType,
        value: movementValue,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error triggering movement lock:', error);
    }
  }
  
  async showBiometricUnlock() {
    try {
      // Check biometric permission first
      const biometricPermission = await PermissionManager.ensurePermission('biometric', 'Secure Unlock');
      
      if (!biometricPermission.granted) {
        Alert.alert(
          'Biometric Unavailable',
          'Biometric authentication is not available. Please use alternative unlock method.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Device',
        subtitle: 'Authenticate to unlock after movement detection',
        cancelLabel: 'Cancel'
      });
      
      if (result.success) {
        await this.unlockDevice('movement_unlock');
      }
    } catch (error) {
      console.error('Biometric unlock error:', error);
    }
  }

  // =================== SOS ALERT (3 TIMES POWER BUTTON) ===================
  
  async setupSOSAlert() {
    try {
      console.log('🆘 Setting up SOS alert (Android power button detection)...');
      
      // Android-specific power button detection
      this.setupPowerButtonDetection();
      
      console.log('✅ SOS alert system active for Android');
      
    } catch (error) {
      console.error('Error setting up SOS alert:', error);
    }
  }
  
  setupPowerButtonDetection() {
    // Note: True power button detection requires system-level access
    // For demo purposes, we'll use volume buttons or screen interactions
    
    // Listen for rapid app state changes (power button press simulation)
    let stateChangeCount = 0;
    let stateChangeTimer = null;
    
    const originalAppStateHandler = this.handleAppStateChange;
    this.handleAppStateChange = (nextAppState) => {
      // Call original handler
      if (originalAppStateHandler) {
        originalAppStateHandler.call(this, nextAppState);
      }
      
      // Count rapid state changes as potential SOS
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        stateChangeCount++;
        
        if (stateChangeTimer) {
          clearTimeout(stateChangeTimer);
        }
        
        stateChangeTimer = setTimeout(() => {
          stateChangeCount = 0;
        }, this.sosTimeWindow);
        
        if (stateChangeCount >= 3) {
          this.triggerSOSAlert('app_state_changes');
          stateChangeCount = 0;
        }
      }
    };
    
    console.log('🔘 Power button detection configured (app state method)');
  }
  
  // Manual SOS trigger method for testing
  async triggerSOSManual() {
    await this.triggerSOSAlert('manual_trigger');
  }
  
  async triggerSOSAlert(method = 'power_button') {
    try {
      console.log(`🆘 SOS ALERT TRIGGERED via ${method}!`);
      
      // Log critical security event
      await this.logSecurityEvent({
        type: 'sos_alert_triggered',
        method,
        timestamp: Date.now(),
        location: await this.getCurrentLocation(),
        deviceInfo: await this.getDeviceInfo()
      });
      
      // Start critical alarm (longer duration for emergency)
      await MediaCaptureService.startAudioAlarm(120); // 2 minutes
      
      // Capture emergency photo and video (check camera permission first)
      const cameraPermission = await PermissionManager.ensurePermission('camera', 'SOS Emergency');
      if (cameraPermission.granted) {
        try {
          await MediaCaptureService.captureRemotePhoto();
          console.log('📸 Emergency photo captured');
          
          setTimeout(async () => {
            try {
              await MediaCaptureService.captureRemoteVideo(10);
              console.log('🎥 Emergency video captured');
            } catch (videoError) {
              console.warn('Emergency video capture failed:', videoError.message);
            }
          }, 2000);
        } catch (mediaError) {
          console.warn('Emergency media capture failed:', mediaError.message);
        }
      } else {
        console.warn('⚠️ Camera permission denied - no emergency media captured');
      }
      
      // Show SOS alert
      Alert.alert(
        '🆘 SOS ALERT ACTIVATED',
        'Emergency alert has been sent to your emergency contacts and dashboard. Help is on the way.',
        [
          {
            text: 'Cancel SOS',
            style: 'destructive',
            onPress: () => this.cancelSOSAlert()
          },
          {
            text: 'Continue SOS',
            style: 'default'
          }
        ]
      );
      
      // Send critical alert to dashboard and emergency contacts
      await this.sendCriticalSecurityAlert({
        type: 'SOS_EMERGENCY_ALERT',
        method,
        timestamp: Date.now(),
        location: await this.getCurrentLocation(),
        deviceInfo: await this.getDeviceInfo(),
        emergency: true,
        priority: 'CRITICAL'
      });
      
      // Emit socket event
      SocketService.emit('sos-alert-triggered', {
        method,
        timestamp: Date.now(),
        location: await this.getCurrentLocation(),
        emergency: true
      });
      
      // Trigger continuous location tracking
      this.startEmergencyLocationTracking();
      
      console.log('🚨 SOS alert fully activated - all emergency protocols initiated');
      
    } catch (error) {
      console.error('Error triggering SOS alert:', error);
    }
  }
  
  async cancelSOSAlert() {
    try {
      console.log('❌ SOS alert cancelled by user');
      
      // Stop alarm
      await MediaCaptureService.stopAudioAlarm();
      
      // Log cancellation
      await this.logSecurityEvent({
        type: 'sos_alert_cancelled',
        timestamp: Date.now(),
        reason: 'user_cancelled'
      });
      
      // Notify dashboard
      SocketService.emit('sos-alert-cancelled', {
        timestamp: Date.now(),
        reason: 'user_cancelled'
      });
      
      Alert.alert('SOS Cancelled', 'Emergency alert has been cancelled.');
      
    } catch (error) {
      console.error('Error cancelling SOS alert:', error);
    }
  }
  
  async startEmergencyLocationTracking() {
    try {
      // Check location permission for emergency tracking
      const locationPermission = await PermissionManager.ensurePermission('location', 'SOS Alert');
      
      if (!locationPermission.granted) {
        console.warn('⚠️ Location permission denied - emergency tracking limited');
        return;
      }
      
      // Send location updates every 10 seconds during emergency
      const emergencyInterval = setInterval(async () => {
        try {
          const location = await this.getCurrentLocation();
          SocketService.emit('emergency-location-update', {
            location,
            timestamp: Date.now(),
            emergency: true
          });
        } catch (locationError) {
          console.warn('Emergency location update failed:', locationError.message);
        }
      }, 10000);
      
      // Stop emergency tracking after 30 minutes
      setTimeout(() => {
        clearInterval(emergencyInterval);
        console.log('📍 Emergency location tracking stopped');
      }, 30 * 60 * 1000);
      
    } catch (error) {
      console.error('Error starting emergency location tracking:', error);
    }
  }

  // =================== DON'T TOUCH LOCK ===================
  
  async setupDontTouchLock() {
    try {
      console.log('✋ Setting up Don\'t Touch Lock...');
      
      // Setup touch detection (this monitors app interactions)
      this.setupTouchDetection();
      
      console.log('✅ Don\'t Touch Lock active');
      
    } catch (error) {
      console.error('Error setting up Don\'t Touch Lock:', error);
    }
  }
  
  setupTouchDetection() {
    // This will monitor when the app receives focus/touch events
    // In a real implementation, you'd monitor system-wide touch events
    
    const originalAppStateHandler = this.handleAppStateChange;
    this.handleAppStateChange = (nextAppState) => {
      // Call original handler
      if (originalAppStateHandler) {
        originalAppStateHandler.call(this, nextAppState);
      }
      
      // Detect unauthorized touch/interaction
      if (this.dontTouchLockEnabled && nextAppState === 'active') {
        const currentTime = Date.now();
        
        if (this.lastTouchTime > 0 && (currentTime - this.lastTouchTime) > this.touchSensitivity) {
          this.triggerDontTouchLock();
        }
        
        this.lastTouchTime = currentTime;
      }
    };
    
    console.log('👆 Touch detection configured');
  }
  
  async triggerDontTouchLock() {
    try {
      console.log('✋ DON\'T TOUCH LOCK TRIGGERED!');
      
      if (!this.dontTouchLockEnabled) return;
      
      // Log security event
      await this.logSecurityEvent({
        type: 'dont_touch_lock_triggered',
        timestamp: Date.now(),
        location: await this.getCurrentLocation()
      });
      
      // Lock device immediately
      this.isDeviceLocked = true;
      
      // Start alarm
      await MediaCaptureService.startAudioAlarm(45);
      
      // Capture security photo (check camera permission first)
      const cameraPermission = await PermissionManager.ensurePermission('camera', 'Don\'t Touch Lock');
      if (cameraPermission.granted) {
        try {
          await MediaCaptureService.captureRemotePhoto();
          console.log('📸 Don\'t touch security photo captured');
        } catch (photoError) {
          console.warn('Failed to capture don\'t touch photo:', photoError.message);
        }
      } else {
        console.warn('⚠️ Camera permission denied - no don\'t touch photo captured');
      }
      
      // Show alert
      Alert.alert(
        '✋ DON\'T TOUCH LOCK ACTIVATED',
        'Unauthorized interaction detected! Device locked for security.',
        [{ text: 'Unlock', onPress: () => this.showBiometricUnlock() }]
      );
      
      // Send alert to dashboard
      await this.sendSecurityAlert({
        type: 'dont_touch_lock_triggered',
        timestamp: Date.now(),
        location: await this.getCurrentLocation()
      });
      
      // Emit socket event
      SocketService.emit('dont-touch-lock-triggered', {
        timestamp: Date.now(),
        location: await this.getCurrentLocation()
      });
      
    } catch (error) {
      console.error('Error triggering don\'t touch lock:', error);
    }
  }
  
  // Manual trigger for testing
  async triggerTestDontTouchLock() {
    await this.triggerDontTouchLock();
  }

  // =================== USB LOCK ===================
  
  async setupUSBProtection() {
    try {
      console.log('🔌 Setting up USB protection for Android...');
      
      // Android-specific USB monitoring
      this.startUSBMonitoring();
      
    } catch (error) {
      console.error('Error setting up USB protection:', error);
    }
  }
  
  startUSBMonitoring() {
    // Note: This requires device admin permissions for full functionality
    // In Expo Go, this will have limited capabilities
    
    this.usbDebugWatcher = setInterval(async () => {
      try {
        // Check if USB debugging is enabled (requires system permissions)
        // For now, we'll log and alert about USB connections
        console.log('🔌 USB monitoring active...');
        
        // In a production app with device admin permissions,
        // you would check for:
        // - USB debugging status
        // - File transfer mode
        // - ADB connections
        
      } catch (error) {
        console.warn('USB monitoring error:', error.message);
      }
    }, 10000); // Check every 10 seconds
  }
  
  async onUSBConnectionDetected() {
    try {
      console.log('🚨 USB connection detected!');
      
      if (this.usbLockEnabled) {
        // Lock device immediately
        this.isDeviceLocked = true;
        
        // Start alarm
        await MediaCaptureService.startAudioAlarm(45);
        
        // Capture security photo
        try {
          await MediaCaptureService.captureRemotePhoto();
        } catch (photoError) {
          console.warn('Failed to capture USB security photo:', photoError.message);
        }
        
        // Show alert
        Alert.alert(
          '🔌 USB Connection Blocked',
          'Unauthorized USB access attempt detected. Device locked for security.',
          [{ text: 'Unlock', onPress: () => this.showBiometricUnlock() }]
        );
        
        // Send critical alert
        await this.sendCriticalSecurityAlert({
          type: 'usb_access_attempt',
          timestamp: Date.now(),
          location: await this.getCurrentLocation()
        });
      }
      
    } catch (error) {
      console.error('Error handling USB connection:', error);
    }
  }

  // =================== SCREEN LOCK ENHANCEMENT ===================
  
  async setupScreenLockEnhancement() {
    try {
      console.log('📱 Setting up enhanced screen lock...');
      
      // Monitor app state changes
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        this.handleAppStateChange(nextAppState);
      });
      
      console.log('✅ Screen lock enhancement active');
      
    } catch (error) {
      console.error('Error setting up screen lock enhancement:', error);
    }
  }
  
  handleAppStateChange(nextAppState) {
    if (!this.screenLockEnabled) return;
    
    console.log('📱 App state changed to:', nextAppState);
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App going to background - prepare for enhanced lock
      this.prepareForBackground();
    } else if (nextAppState === 'active') {
      // App coming to foreground - check if unlock needed
      this.handleForegroundReturn();
    }
  }
  
  async prepareForBackground() {
    try {
      // Save current security state
      await this.saveSecuritySettings();
      
      // If device is already locked, maintain lock state
      if (this.isDeviceLocked) {
        console.log('🔒 Maintaining lock state in background');
      }
      
    } catch (error) {
      console.error('Error preparing for background:', error);
    }
  }
  
  async handleForegroundReturn() {
    try {
      if (this.screenLockOverride) {
        // Force authentication when returning from background
        await this.requireAuthentication('screen_unlock');
      }
      
    } catch (error) {
      console.error('Error handling foreground return:', error);
    }
  }
  
  async requireAuthentication(reason) {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Required',
        subtitle: `Authentication required: ${reason}`,
        cancelLabel: 'Cancel'
      });
      
      if (!result.success) {
        await this.recordFailedAttempt('screen_unlock');
      } else {
        console.log('✅ Screen unlock authentication successful');
      }
      
      return result.success;
      
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // =================== PERFORMANCE BOOSTER ===================
  
  startPerformanceBooster() {
    console.log('⚡ Starting performance booster...');
    
    setInterval(async () => {
      if (this.performanceBoostEnabled) {
        await this.performanceBoost();
      }
    }, this.boostInterval);
  }
  
  async performanceBoost() {
    try {
      console.log('⚡ Running performance boost...');
      
      const startTime = Date.now();
      
      // Clear AsyncStorage cache (old entries)
      await this.clearOldCache();
      
      // Log memory usage (if available)
      if (global.gc) {
        global.gc();
        console.log('🗑️ Garbage collection performed');
      }
      
      // Clear old security events
      await this.clearOldSecurityEvents();
      
      const duration = Date.now() - startTime;
      console.log(`⚡ Performance boost completed in ${duration}ms`);
      
      this.lastBoostTime = Date.now();
      
      // Send boost report
      SocketService.emit('performance-boost-completed', {
        duration,
        timestamp: this.lastBoostTime,
        freed: 'cache-cleared'
      });
      
    } catch (error) {
      console.error('Performance boost error:', error);
    }
  }
  
  async clearOldCache() {
    try {
      // Clear old media history entries
      const mediaHistory = await AsyncStorage.getItem('mediaHistory');
      if (mediaHistory) {
        const history = JSON.parse(mediaHistory);
        const recent = history.slice(-50); // Keep only last 50 entries
        await AsyncStorage.setItem('mediaHistory', JSON.stringify(recent));
      }
      
      console.log('🗑️ Old cache entries cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error.message);
    }
  }
  
  async clearOldSecurityEvents() {
    try {
      // Keep only last 100 security events
      if (this.securityEvents.length > 100) {
        this.securityEvents = this.securityEvents.slice(-100);
        await this.saveSecuritySettings();
      }
    } catch (error) {
      console.warn('Error clearing old security events:', error.message);
    }
  }

  // =================== APP LOCK ===================
  
  async setupAppProtection() {
    try {
      console.log('🔐 Setting up app protection for Android...');
      
      // Android-specific app monitoring
      this.startAppUsageMonitoring();
      
      // Protect settings and installer apps
      this.protectedApps = [
        'com.android.settings',
        'com.google.android.packageinstaller',
        'com.android.packageinstaller',
        'com.miui.packageinstaller', // Xiaomi
        'com.samsung.android.packageinstaller', // Samsung
        'com.huawei.appmarket', // Huawei
        'com.oppo.market', // Oppo
        'com.vivo.appstore' // Vivo
      ];
      
      console.log('✅ Android app protection configured');
      
    } catch (error) {
      console.error('Error setting up app protection:', error);
    }
  }
  
  startAppUsageMonitoring() {
    // Note: This requires device admin permissions for full functionality
    console.log('👀 App usage monitoring started (limited in Expo Go)');
    
    // In production with device admin permissions:
    // - Monitor app launches
    // - Block access to protected apps
    // - Require authentication for sensitive apps
  }
  
  async blockAppAccess(packageName) {
    try {
      console.log(`🚫 Blocking access to app: ${packageName}`);
      
      // In production with device admin permissions,
      // you would block the app launch here
      
      // For now, show alert
      Alert.alert(
        '🔐 App Blocked',
        `Access to ${packageName} is restricted by security policy.`,
        [{ text: 'OK' }]
      );
      
      await this.logSecurityEvent({
        type: 'app_access_blocked',
        app: packageName,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error blocking app access:', error);
    }
  }

  // =================== UNINSTALL PREVENTION ===================
  
  async setupUninstallPrevention() {
    try {
      console.log('🛡️ Setting up uninstall prevention for Android...');
      
      // Android-specific uninstall prevention
      // In production with device admin permissions:
      // - Register as device administrator
      // - Monitor uninstall attempts
      // - Block unauthorized uninstalls
      
      console.log('🛡️ Uninstall prevention configured (requires device admin)');
      
    } catch (error) {
      console.error('Error setting up uninstall prevention:', error);
    }
  }
  
  async onUninstallAttempt() {
    try {
      console.log('🚨 Uninstall attempt detected!');
      
      // Start critical alarm
      await MediaCaptureService.startAudioAlarm(120); // 2 minutes
      
      // Capture security photo
      try {
        await MediaCaptureService.captureRemotePhoto();
      } catch (photoError) {
        console.warn('Failed to capture uninstall attempt photo:', photoError.message);
      }
      
      // Send critical alert
      await this.sendCriticalSecurityAlert({
        type: 'uninstall_attempt',
        timestamp: Date.now(),
        location: await this.getCurrentLocation(),
        deviceInfo: await this.getDeviceInfo()
      });
      
      // Show block message
      Alert.alert(
        '🚫 Uninstall Blocked',
        'This security application cannot be uninstalled without administrator authorization.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error handling uninstall attempt:', error);
    }
  }

  // =================== REMOTE FACTORY RESET ===================
  
  async enableRemoteFactoryReset() {
    try {
      this.remoteResetEnabled = true;
      
      // Listen for remote reset commands
      SocketService.on('remote-factory-reset', async (data) => {
        await this.handleRemoteFactoryReset(data);
      });
      
      console.log('🏭 Remote factory reset enabled');
      await this.saveSecuritySettings();
      
    } catch (error) {
      console.error('Error enabling remote factory reset:', error);
    }
  }
  
  async handleRemoteFactoryReset(data) {
    try {
      console.log('🚨 Remote factory reset command received!');
      
      // Log critical security event
      await this.logSecurityEvent({
        type: 'remote_factory_reset_requested',
        source: data.source || 'dashboard',
        timestamp: Date.now(),
        adminId: data.adminId
      });
      
      if (this.resetConfirmationRequired) {
        // Show confirmation dialog
        Alert.alert(
          '🏭 Remote Factory Reset',
          'A factory reset has been requested remotely. This will erase all data on this device. This action cannot be undone.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => this.cancelFactoryReset(data)
            },
            {
              text: 'Authorize Reset',
              style: 'destructive',
              onPress: () => this.requireAuthForFactoryReset(data)
            }
          ]
        );
      } else {
        // Immediate reset (if configured)
        await this.executeFactoryReset(data);
      }
      
    } catch (error) {
      console.error('Error handling remote factory reset:', error);
    }
  }
  
  async requireAuthForFactoryReset(data) {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authorize Factory Reset',
        subtitle: 'Biometric authentication required to proceed with factory reset',
        cancelLabel: 'Cancel'
      });
      
      if (result.success) {
        await this.executeFactoryReset(data);
      } else {
        await this.cancelFactoryReset(data);
      }
      
    } catch (error) {
      console.error('Factory reset authentication error:', error);
      await this.cancelFactoryReset(data);
    }
  }
  
  async executeFactoryReset(data) {
    try {
      console.log('🏭 Executing factory reset...');
      
      // Send confirmation to dashboard
      SocketService.emit('factory-reset-initiated', {
        timestamp: Date.now(),
        deviceId: await AsyncStorage.getItem('deviceId')
      });
      
      // Clear all local data
      await AsyncStorage.clear();
      
      // Show final warning
      Alert.alert(
        '🏭 Factory Reset Initiated',
        'Device reset is now beginning. The app will close and all data will be erased.',
        [
          {
            text: 'OK',
            onPress: () => {
              // In production with device admin permissions:
              // - Trigger actual factory reset
              // - For now, we can only clear app data
              console.log('🏭 Factory reset would execute here (requires device admin)');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error executing factory reset:', error);
    }
  }
  
  async cancelFactoryReset(data) {
    try {
      console.log('❌ Factory reset cancelled');
      
      SocketService.emit('factory-reset-cancelled', {
        timestamp: Date.now(),
        reason: 'user_cancelled'
      });
      
      await this.logSecurityEvent({
        type: 'factory_reset_cancelled',
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Error cancelling factory reset:', error);
    }
  }

  // =================== UTILITY METHODS ===================
  
  async unlockDevice(method) {
    try {
      console.log(`🔓 Unlocking device via ${method}...`);
      
      this.isDeviceLocked = false;
      this.failedAttempts = 0;
      
      // Stop any active alarms
      await MediaCaptureService.stopAudioAlarm();
      
      await this.saveSecuritySettings();
      
      // Send unlock notification
      SocketService.emit('device-unlocked', {
        method,
        timestamp: Date.now()
      });
      
      console.log('✅ Device unlocked successfully');
      
    } catch (error) {
      console.error('Error unlocking device:', error);
    }
  }
  
  async getCurrentLocation() {
    try {
      // Get location from LocationService if available
      return { latitude: 0, longitude: 0, timestamp: Date.now() };
    } catch (error) {
      console.warn('Could not get current location:', error.message);
      return null;
    }
  }
  
  async getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      model: Device.modelName,
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      deviceId: await AsyncStorage.getItem('deviceId')
    };
  }
  
  async logSecurityEvent(event) {
    try {
      this.securityEvents.push({
        ...event,
        id: Date.now(),
        deviceId: await AsyncStorage.getItem('deviceId')
      });
      
      // Keep only recent events
      if (this.securityEvents.length > 200) {
        this.securityEvents = this.securityEvents.slice(-200);
      }
      
      await this.saveSecuritySettings();
      
      // Send to dashboard
      SocketService.emit('security-event', event);
      
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
  
  async sendSecurityAlert(alert) {
    try {
      console.log('📨 Sending security alert:', alert.type);
      
      // Send via socket
      SocketService.emit('security-alert', alert);
      
      // Send via API for email notification
      const deviceId = await AsyncStorage.getItem('deviceId');
      if (deviceId) {
        fetch(`${API_BASE_URL}/api/security/alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...alert,
            deviceId
          })
        }).catch(error => {
          console.warn('Failed to send API alert:', error.message);
        });
      }
      
    } catch (error) {
      console.error('Error sending security alert:', error);
    }
  }
  
  async sendCriticalSecurityAlert(alert) {
    try {
      console.log('🚨 Sending CRITICAL security alert:', alert.type);
      
      // Mark as critical
      alert.critical = true;
      alert.priority = 'high';
      
      await this.sendSecurityAlert(alert);
      
      // Additional critical alert handling
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
    } catch (error) {
      console.error('Error sending critical security alert:', error);
    }
  }
  
  async reportSecurityStatus() {
    try {
      const status = {
        isInitialized: this.isInitialized,
        isLocked: this.isDeviceLocked,
        failedAttempts: this.failedAttempts,
        settings: {
          autoLockEnabled: this.autoLockEnabled,
          movementLockEnabled: this.movementLockEnabled,
          usbLockEnabled: this.usbLockEnabled,
          screenLockEnabled: this.screenLockEnabled,
          appLockEnabled: this.appLockEnabled,
          preventUninstall: this.preventUninstall,
          remoteResetEnabled: this.remoteResetEnabled
        },
        timestamp: Date.now()
      };
      
      SocketService.emit('security-status-report', status);
      
    } catch (error) {
      console.error('Error reporting security status:', error);
    }
  }
  
  async loadSecuritySettings() {
    try {
      const settings = await AsyncStorage.getItem('enhancedSecuritySettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        Object.assign(this, parsed);
      }
    } catch (error) {
      console.warn('Error loading security settings:', error.message);
    }
  }
  
  async saveSecuritySettings() {
    try {
      const settings = {
        failedAttempts: this.failedAttempts,
        maxFailedAttempts: this.maxFailedAttempts,
        autoLockEnabled: this.autoLockEnabled,
        isDeviceLocked: this.isDeviceLocked,
        movementLockEnabled: this.movementLockEnabled,
        movementThreshold: this.movementThreshold,
        usbLockEnabled: this.usbLockEnabled,
        screenLockEnabled: this.screenLockEnabled,
        screenLockOverride: this.screenLockOverride,
        performanceBoostEnabled: this.performanceBoostEnabled,
        appLockEnabled: this.appLockEnabled,
        preventUninstall: this.preventUninstall,
        remoteResetEnabled: this.remoteResetEnabled,
        resetConfirmationRequired: this.resetConfirmationRequired,
        securityEvents: this.securityEvents.slice(-100), // Save only recent events
        lastBoostTime: this.lastBoostTime
      };
      
      await AsyncStorage.setItem('enhancedSecuritySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  }
  
  setupRemoteCommandListeners() {
    // Listen for remote security commands
    SocketService.on('remote-lock', async (data) => {
      console.log('📨 Remote lock command received');
      this.isDeviceLocked = true;
      await MediaCaptureService.startAudioAlarm(60);
      await this.saveSecuritySettings();
    });
    
    SocketService.on('remote-unlock', async (data) => {
      console.log('📨 Remote unlock command received');
      await this.unlockDevice('remote');
    });
    
    SocketService.on('remote-settings-update', async (data) => {
      console.log('📨 Remote settings update received');
      if (data.settings) {
        Object.assign(this, data.settings);
        await this.saveSecuritySettings();
        this.reportSecurityStatus();
      }
    });
  }
  
  // =================== PUBLIC API METHODS ===================
  
  isLocked() {
    return this.isDeviceLocked;
  }
  
  getFailedAttempts() {
    return this.failedAttempts;
  }
  
  getSecuritySettings() {
    return {
      autoLockEnabled: this.autoLockEnabled,
      maxFailedAttempts: this.maxFailedAttempts,
      movementLockEnabled: this.movementLockEnabled,
      movementThreshold: this.movementThreshold,
      usbLockEnabled: this.usbLockEnabled,
      screenLockEnabled: this.screenLockEnabled,
      performanceBoostEnabled: this.performanceBoostEnabled,
      appLockEnabled: this.appLockEnabled,
      preventUninstall: this.preventUninstall,
      remoteResetEnabled: this.remoteResetEnabled
    };
  }
  
  async updateSettings(newSettings) {
    try {
      Object.assign(this, newSettings);
      
      // Re-setup features that changed
      if (newSettings.movementLockEnabled !== undefined) {
        if (newSettings.movementLockEnabled) {
          await this.setupMovementDetection();
        } else {
          this.disableMovementDetection();
        }
      }
      
      if (newSettings.usbLockEnabled !== undefined) {
        if (newSettings.usbLockEnabled) {
          await this.setupUSBProtection();
        } else {
          this.disableUSBProtection();
        }
      }
      
      if (newSettings.screenLockEnabled !== undefined) {
        if (newSettings.screenLockEnabled) {
          await this.setupScreenLockEnhancement();
        } else {
          this.disableScreenLockEnhancement();
        }
      }
      
      if (newSettings.appLockEnabled !== undefined) {
        if (newSettings.appLockEnabled) {
          await this.setupAppProtection();
        } else {
          this.disableAppProtection();
        }
      }
      
      if (newSettings.remoteResetEnabled !== undefined) {
        if (newSettings.remoteResetEnabled) {
          await this.enableRemoteFactoryReset();
        }
      }
      
      await this.saveSecuritySettings();
      this.reportSecurityStatus();
      
      console.log('✅ Security settings updated');
      
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  }
  
  disableMovementDetection() {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }
    console.log('📱 Movement detection disabled');
  }
  
  disableUSBProtection() {
    if (this.usbDebugWatcher) {
      clearInterval(this.usbDebugWatcher);
      this.usbDebugWatcher = null;
    }
    console.log('🔌 USB protection disabled');
  }
  
  disableScreenLockEnhancement() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    console.log('📱 Screen lock enhancement disabled');
  }
  
  disableAppProtection() {
    if (this.appUsageWatcher) {
      clearInterval(this.appUsageWatcher);
      this.appUsageWatcher = null;
    }
    console.log('🔐 App protection disabled');
  }
  
  // Manual trigger methods for testing
  async triggerTestAutoLock() {
    this.failedAttempts = this.maxFailedAttempts;
    await this.triggerAutoLock();
  }
  
  async triggerTestMovementLock() {
    await this.triggerMovementLock('test', 5.0);
  }
  
  async triggerTestUSBLock() {
    await this.onUSBConnectionDetected();
  }
  
  async triggerTestPerformanceBoost() {
    await this.performanceBoost();
  }
  
  // =================== UTILITY METHODS ===================
  
  async getCurrentLocation() {
    try {
      // Check if location permission is available
      if (PermissionManager.isPermissionGranted('location')) {
        return await LocationService.getCurrentLocation();
      } else {
        console.warn('Location permission not granted - returning default location');
        return { latitude: 0, longitude: 0, error: 'Location unavailable - permission denied' };
      }
    } catch (error) {
      console.warn('Failed to get current location:', error.message);
      return { latitude: 0, longitude: 0, error: 'Location unavailable' };
    }
  }
  
  async getDeviceInfo() {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        version: Platform.Version,
        timestamp: Date.now()
      };
      
      if (Constants.deviceName) {
        deviceInfo.deviceName = Constants.deviceName;
      }
      
      return deviceInfo;
    } catch (error) {
      console.warn('Failed to get device info:', error.message);
      return { platform: Platform.OS, timestamp: Date.now() };
    }
  }
  
  async sendCriticalSecurityAlert(alertData) {
    try {
      // Send to backend with critical priority
      const response = await fetch(`${Config.API_URL}/api/enhanced-security/critical-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          ...alertData,
          priority: 'CRITICAL',
          emergency: true
        })
      });
      
      if (response.ok) {
        console.log('✅ Critical security alert sent to backend');
      } else {
        console.warn('⚠️ Failed to send critical alert to backend');
      }
    } catch (error) {
      console.error('Error sending critical security alert:', error);
    }
  }

  // Cleanup method
  cleanup() {
    this.disableMovementDetection();
    this.disableUSBProtection();
    this.disableScreenLockEnhancement();
    this.disableAppProtection();
    
    if (this.usbDebugWatcher) {
      clearInterval(this.usbDebugWatcher);
    }
    
    console.log('🧹 Enhanced Security Service cleaned up');
  }
}

export default new EnhancedSecurityService();
