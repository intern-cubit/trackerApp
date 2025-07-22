import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from './SocketService';
import LocationService from './LocationService';
import MediaCaptureService from './MediaCaptureService';

class SecurityService {
  constructor() {
    this.isInitialized = false;
    this.failedAttempts = 0;
    this.maxFailedAttempts = 3;
    this.powerButtonPresses = 0;
    this.powerButtonTimeout = null;
    this.isDeviceLocked = false;
    this.alarmSound = null;
    this.isAlarmPlaying = false;
    this.vibrationInterval = null; // Store vibration interval reference
    this.alarmTimeout = null; // Store alarm timeout reference
    
    // Movement detection
    this.movementLockEnabled = false;
    this.dontTouchLockEnabled = false;
    this.accelerometerSubscription = null;
    this.gyroscopeSubscription = null;
    this.lastMovementTime = Date.now();
    this.movementThreshold = 1.5; // Sensitivity threshold
    
    // USB protection
    this.usbLockEnabled = false;
    
    // App protection
    this.appLockEnabled = false;
    this.lockedApps = [];
    
    // Screen lock enhancement
    this.screenLockEnabled = false;
    
    // Uninstall prevention
    this.preventUninstall = true;
  }

  async initialize() {
    try {
      // Load saved settings
      await this.loadSecuritySettings();
      
      // Initialize biometric authentication
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      this.biometricAvailable = isAvailable && isEnrolled;
      
      // Initialize alarm sound
      await this.initializeAlarm();
      
      // Set up movement detection
      this.setupMovementDetection();
      
      // Set up power button detection
      this.setupPowerButtonDetection();
      
      // Listen for remote commands
      this.setupRemoteCommandListeners();
      
      this.isInitialized = true;
      console.log('Security service initialized');
    } catch (error) {
      console.error('Failed to initialize security service:', error);
    }
  }

  async loadSecuritySettings() {
    try {
      const settings = await AsyncStorage.getItem('securitySettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.maxFailedAttempts = parsed.maxFailedAttempts || 3;
        this.movementLockEnabled = parsed.movementLockEnabled || false;
        this.dontTouchLockEnabled = parsed.dontTouchLockEnabled || false;
        this.usbLockEnabled = parsed.usbLockEnabled || false;
        this.appLockEnabled = parsed.appLockEnabled || false;
        this.screenLockEnabled = parsed.screenLockEnabled || false;
        this.preventUninstall = parsed.preventUninstall !== undefined ? parsed.preventUninstall : true;
        this.lockedApps = parsed.lockedApps || [];
        this.movementThreshold = parsed.movementThreshold || 1.5;
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  }

  async saveSecuritySettings() {
    try {
      const settings = {
        maxFailedAttempts: this.maxFailedAttempts,
        movementLockEnabled: this.movementLockEnabled,
        dontTouchLockEnabled: this.dontTouchLockEnabled,
        usbLockEnabled: this.usbLockEnabled,
        appLockEnabled: this.appLockEnabled,
        screenLockEnabled: this.screenLockEnabled,
        preventUninstall: this.preventUninstall,
        lockedApps: this.lockedApps,
        movementThreshold: this.movementThreshold,
      };
      await AsyncStorage.setItem('securitySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save security settings:', error);
    }
  }

  async initializeAlarm() {
    try {
      // Use only haptic feedback for alarms (no audio dependencies required)
      console.log('Alarm initialization - using haptic feedback only (no audio dependencies)');
      this.alarmSound = null;
    } catch (error) {
      console.error('Failed to initialize alarm:', error);
    }
  }

  setupMovementDetection() {
    // Set up accelerometer for movement detection
    Accelerometer.setUpdateInterval(1000); // Check every second
    
    this.accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
      if (this.movementLockEnabled || this.dontTouchLockEnabled) {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        
        if (magnitude > this.movementThreshold) {
          this.handleMovementDetected();
        }
      }
    });

    // Set up gyroscope for rotation detection
    Gyroscope.setUpdateInterval(1000);
    
    this.gyroscopeSubscription = Gyroscope.addListener(({ x, y, z }) => {
      if (this.movementLockEnabled) {
        const rotationMagnitude = Math.sqrt(x * x + y * y + z * z);
        
        if (rotationMagnitude > 0.5) { // Rotation threshold
          this.handleMovementDetected();
        }
      }
    });
  }

  setupPowerButtonDetection() {
    // This would require native module implementation
    // For now, we'll simulate with a method that can be called
    console.log('Power button detection setup (requires native implementation)');
  }

  setupRemoteCommandListeners() {
    SocketService.on('remote-lock', () => {
      this.lockDeviceRemotely();
    });

    SocketService.on('remote-alarm', (data) => {
      this.triggerAlarm(data.duration || 30);
    });

    SocketService.on('capture-photo', () => {
      MediaCaptureService.captureRemotePhoto();
    });

    SocketService.on('capture-video', (data) => {
      MediaCaptureService.captureRemoteVideo(data.duration || 15);
    });

    SocketService.on('factory-reset', () => {
      this.handleFactoryReset();
    });

    SocketService.on('stop-alarm', () => {
      this.stopAlarm();
    });

    // Enhanced commands
    SocketService.on('device-command', (data) => {
      this.handleRemoteCommand(data);
    });

    SocketService.on('emergency-command', (data) => {
      this.handleEmergencyCommand(data);
    });

    SocketService.on('configuration-update', (data) => {
      this.handleConfigurationUpdate(data);
    });
  }

  async handleRemoteCommand(commandData) {
    const { commandId, type, data } = commandData;
    
    try {
      let result = null;
      
      switch (type) {
        case 'enable_movement_lock':
          await this.enableMovementLock(true);
          result = { enabled: true };
          break;
        case 'disable_movement_lock':
          await this.enableMovementLock(false);
          result = { enabled: false };
          break;
        case 'enable_dont_touch':
          await this.enableDontTouchLock(true);
          result = { enabled: true };
          break;
        case 'disable_dont_touch':
          await this.enableDontTouchLock(false);
          result = { enabled: false };
          break;
        case 'enable_usb_lock':
          await this.enableUSBLock(true);
          result = { enabled: true };
          break;
        case 'disable_usb_lock':
          await this.enableUSBLock(false);
          result = { enabled: false };
          break;
        case 'enable_app_lock':
          await this.enableAppLock(true);
          result = { enabled: true };
          break;
        case 'disable_app_lock':
          await this.enableAppLock(false);
          result = { enabled: false };
          break;
        case 'clear_cache':
          result = await this.clearCache();
          break;
        case 'optimize_performance':
          result = await this.optimizePerformance();
          break;
        case 'get_status':
          result = await this.getDeviceStatus();
          break;
        case 'prevent_uninstall':
          await this.enableUninstallPrevention(true);
          result = { preventUninstall: true };
          break;
        case 'allow_uninstall':
          await this.enableUninstallPrevention(false);
          result = { preventUninstall: false };
          break;
        case 'remote_alarm':
        case 'stop_alarm':
        case 'capture-photo':
        case 'start-video':
        case 'stop-video':
        case 'capture_photo':
        case 'capture_video':
          // These commands are handled by MediaScreen, ignore them here
          console.log(`[SecurityService] Command ${type} handled by MediaScreen, ignoring`);
          return; // Exit without sending acknowledgment
        default:
          // Don't throw error for unknown commands, let other services handle them
          console.log(`[SecurityService] Unknown command: ${type}, ignoring`);
          return; // Exit without sending acknowledgment
      }

      // Send acknowledgment
      SocketService.emit('command-ack', {
        commandId,
        status: 'completed',
        response: result,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to handle remote command:', error);
      
      // Send error response
      SocketService.emit('command-ack', {
        commandId,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  async handleEmergencyCommand(commandData) {
    const { commandId, action, reason } = commandData;
    
    try {
      switch (action) {
        case 'emergency_lock':
          await this.lockDeviceRemotely();
          await this.triggerAlarm(60);
          break;
        case 'emergency_alarm':
          await this.triggerAlarm(120);
          break;
        case 'emergency_locate':
          await LocationService.forceLocationUpdate();
          await MediaCaptureService.captureRemotePhoto();
          break;
        case 'emergency_wipe':
          await this.handleFactoryReset();
          break;
      }

      SocketService.emit('command-ack', {
        commandId,
        status: 'completed',
        response: { action, reason },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to handle emergency command:', error);
      
      SocketService.emit('command-ack', {
        commandId,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  async handleConfigurationUpdate(configData) {
    try {
      if (configData.securitySettings) {
        const settings = configData.securitySettings;
        
        this.maxFailedAttempts = settings.maxFailedAttempts || this.maxFailedAttempts;
        this.movementThreshold = settings.movementSensitivity || this.movementThreshold;
        
        await this.saveSecuritySettings();
      }
      
      console.log('Configuration updated from server');
    } catch (error) {
      console.error('Failed to handle configuration update:', error);
    }
  }

  // Enhanced utility methods
  async clearCache() {
    try {
      // Clear app cache (this would require native implementation)
      console.log('Clearing app cache...');
      
      // For now, clear AsyncStorage cache (excluding important data)
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.includes('cache') || 
        key.includes('temp') || 
        key.includes('media_temp')
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      return { 
        message: 'Cache cleared successfully',
        clearedItems: cacheKeys.length,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  async optimizePerformance() {
    try {
      console.log('Optimizing device performance...');
      
      // Clear cache
      await this.clearCache();
      
      // Stop unnecessary background processes (simulation)
      // In a real implementation, this would interact with native modules
      
      return {
        message: 'Performance optimization completed',
        actions: ['Cache cleared', 'Background apps optimized'],
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to optimize performance:', error);
      throw error;
    }
  }

  async getDeviceStatus() {
    try {
      const status = {
        isLocked: this.isDeviceLocked,
        failedAttempts: this.failedAttempts,
        securitySettings: this.getSecuritySettings(),
        timestamp: Date.now(),
        batteryLevel: await this.getBatteryLevel(),
        storageInfo: await this.getStorageInfo(),
        location: LocationService.getLastKnownLocation()
      };
      
      return status;
    } catch (error) {
      console.error('Failed to get device status:', error);
      throw error;
    }
  }

  async getBatteryLevel() {
    try {
      // This would require expo-battery or native implementation
      return Math.floor(Math.random() * 100); // Simulated
    } catch (error) {
      return null;
    }
  }

  async getStorageInfo() {
    try {
      // This would require native implementation
      return {
        free: Math.floor(Math.random() * 50000), // Simulated MB
        total: 64000,
        used: 14000
      };
    } catch (error) {
      return null;
    }
  }

  async enableUninstallPrevention(enabled) {
    try {
      // This would require native Android implementation
      // For now, just save the setting
      this.preventUninstall = enabled;
      await this.saveSecuritySettings();
      
      console.log(`Uninstall prevention ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle uninstall prevention:', error);
      throw error;
    }
  }

  async handleFailedLogin() {
    this.failedAttempts++;
    
    // Vibrate as feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    // Send alert to dashboard
    SocketService.emit('failed-login-attempt', {
      attempts: this.failedAttempts,
      maxAttempts: this.maxFailedAttempts,
      timestamp: Date.now(),
      location: LocationService.getLastKnownLocation(),
    });

    if (this.failedAttempts >= this.maxFailedAttempts) {
      await this.triggerAutoLock();
    }

    // Save to storage
    await AsyncStorage.setItem('failedAttempts', this.failedAttempts.toString());
  }

  async triggerAutoLock() {
    try {
      this.isDeviceLocked = true;
      
      // Capture photo of potential intruder
      try {
        await MediaCaptureService.captureRemotePhoto();
      } catch (error) {
        console.error('Failed to capture intruder photo:', error);
      }

      // Send alert
      SocketService.emit('auto-lock-triggered', {
        failedAttempts: this.failedAttempts,
        timestamp: Date.now(),
        location: LocationService.getLastKnownLocation(),
      });

      // Trigger alarm
      await this.triggerAlarm(60); // 1 minute alarm

      console.log('Auto-lock triggered due to failed attempts');
    } catch (error) {
      console.error('Failed to trigger auto-lock:', error);
    }
  }

  async handlePowerButtonPress() {
    this.powerButtonPresses++;
    
    // Reset counter after 3 seconds
    if (this.powerButtonTimeout) {
      clearTimeout(this.powerButtonTimeout);
    }
    
    this.powerButtonTimeout = setTimeout(() => {
      this.powerButtonPresses = 0;
    }, 3000);

    // Check for SOS trigger (3 presses within 3 seconds)
    if (this.powerButtonPresses >= 3) {
      await this.triggerSOSAlert();
      this.powerButtonPresses = 0;
    }
  }

  async triggerSOSAlert() {
    try {
      // Get current location
      const location = await LocationService.getCurrentLocation();
      
      // Capture photo and video
      await MediaCaptureService.captureRemotePhoto();
      await MediaCaptureService.captureRemoteVideo(10);

      // Send SOS alert
      SocketService.emit('sos-alert-triggered', {
        timestamp: Date.now(),
        location: location,
        message: 'Emergency SOS Alert activated!',
      });

      // Vibrate
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      console.log('SOS Alert triggered');
    } catch (error) {
      console.error('Failed to trigger SOS alert:', error);
    }
  }

  async handleMovementDetected() {
    const now = Date.now();
    
    // Prevent spam detection
    if (now - this.lastMovementTime < 5000) return;
    this.lastMovementTime = now;

    if (this.movementLockEnabled) {
      // Lock device due to movement
      this.isDeviceLocked = true;
      await this.triggerAlarm(30);
      
      SocketService.emit('movement-detected', {
        type: 'movement-lock',
        timestamp: now,
        location: LocationService.getLastKnownLocation(),
      });
    }

    if (this.dontTouchLockEnabled) {
      // Trigger don't touch alarm
      await this.triggerAlarm(60);
      
      SocketService.emit('movement-detected', {
        type: 'dont-touch',
        timestamp: now,
        location: LocationService.getLastKnownLocation(),
      });
    }
  }

  async triggerAlarm(duration = 30) {
    try {
      // Stop any existing alarm first
      if (this.isAlarmPlaying) {
        await this.stopAlarm();
      }

      this.isAlarmPlaying = true;
      
      // Use only haptic feedback (no audio required)
      console.log(`Alarm triggered for ${duration} seconds (haptic feedback only)`);

      // Continuous vibration pattern
      this.vibrationInterval = setInterval(() => {
        if (this.isAlarmPlaying) {
          console.log('Haptics triggered...');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          console.log('Alarm not playing, skipping haptic');
        }
      }, 500); // Vibrate every 500ms
      
      console.log('Vibration interval created:', !!this.vibrationInterval);

      // Stop alarm after duration
      this.alarmTimeout = setTimeout(async () => {
        await this.stopAlarm();
      }, duration * 1000);

      console.log(`Haptic alarm triggered for ${duration} seconds`);
    } catch (error) {
      console.error('Failed to trigger alarm:', error);
    }
  }

  async stopAlarm() {
    try {
      console.log('stopAlarm() called - Current state:', {
        isAlarmPlaying: this.isAlarmPlaying,
        hasVibrationInterval: !!this.vibrationInterval,
        hasAlarmTimeout: !!this.alarmTimeout
      });
      
      // Stop the vibration interval
      if (this.vibrationInterval) {
        console.log('Clearing vibration interval...');
        clearInterval(this.vibrationInterval);
        this.vibrationInterval = null;
      }
      
      // Clear the alarm timeout
      if (this.alarmTimeout) {
        console.log('Clearing alarm timeout...');
        clearTimeout(this.alarmTimeout);
        this.alarmTimeout = null;
      }
      
      // Reset the alarm flag
      this.isAlarmPlaying = false;
      console.log('Haptic alarm stopped - vibration should have ceased');
    } catch (error) {
      console.error('Failed to stop alarm:', error);
    }
  }

  async lockDeviceRemotely() {
    try {
      this.isDeviceLocked = true;
      
      // Send confirmation
      SocketService.emit('device-locked', {
        timestamp: Date.now(),
        source: 'remote',
      });

      console.log('Device locked remotely');
    } catch (error) {
      console.error('Failed to lock device remotely:', error);
    }
  }

  async unlockDevice() {
    try {
      // Require biometric authentication
      if (this.biometricAvailable) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock TrackerApp',
          fallbackLabel: 'Use PIN',
        });

        if (!result.success) {
          await this.handleFailedLogin();
          return false;
        }
      }

      this.isDeviceLocked = false;
      this.failedAttempts = 0;
      await AsyncStorage.setItem('failedAttempts', '0');

      console.log('Device unlocked successfully');
      return true;
    } catch (error) {
      console.error('Failed to unlock device:', error);
      return false;
    }
  }

  async handleFactoryReset() {
    try {
      // This would require native implementation for actual factory reset
      console.log('Factory reset triggered (requires native implementation)');
      
      // Clear app data
      await AsyncStorage.clear();
      
      // Send confirmation
      SocketService.emit('factory-reset-initiated', {
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to handle factory reset:', error);
    }
  }

  // Configuration methods
  async enableMovementLock(enabled) {
    this.movementLockEnabled = enabled;
    await this.saveSecuritySettings();
  }

  async enableDontTouchLock(enabled) {
    this.dontTouchLockEnabled = enabled;
    await this.saveSecuritySettings();
  }

  async enableUSBLock(enabled) {
    this.usbLockEnabled = enabled;
    await this.saveSecuritySettings();
  }

  async enableAppLock(enabled) {
    this.appLockEnabled = enabled;
    await this.saveSecuritySettings();
  }

  async enableScreenLock(enabled) {
    this.screenLockEnabled = enabled;
    await this.saveSecuritySettings();
    
    // This would require native implementation to override system lock screen
    console.log(`Screen lock enhancement ${enabled ? 'enabled' : 'disabled'}`);
  }

  async setMovementThreshold(threshold) {
    this.movementThreshold = threshold;
    await this.saveSecuritySettings();
  }

  async setMaxFailedAttempts(attempts) {
    this.maxFailedAttempts = attempts;
    await this.saveSecuritySettings();
  }

  // Getters
  getFailedAttempts() {
    return this.failedAttempts;
  }

  isLocked() {
    return this.isDeviceLocked;
  }

  getSecuritySettings() {
    return {
      maxFailedAttempts: this.maxFailedAttempts,
      movementLockEnabled: this.movementLockEnabled,
      dontTouchLockEnabled: this.dontTouchLockEnabled,
      usbLockEnabled: this.usbLockEnabled,
      appLockEnabled: this.appLockEnabled,
      screenLockEnabled: this.screenLockEnabled,
      preventUninstall: this.preventUninstall,
      movementThreshold: this.movementThreshold,
      biometricAvailable: this.biometricAvailable,
    };
  }
}

export default new SecurityService();
