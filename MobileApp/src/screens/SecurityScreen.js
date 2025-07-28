import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SecurityService from '../services/SecurityService';
import SocketService from '../services/SocketService';

const SecurityScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    maxFailedAttempts: 3,
    movementLockEnabled: false,
    dontTouchLockEnabled: false,
    usbLockEnabled: false,
    appLockEnabled: false,
    movementThreshold: 1.5,
    biometricAvailable: false,
  });

  const [deviceStatus, setDeviceStatus] = useState({
    isLocked: false,
    failedAttempts: 0,
    isAlarmPlaying: false,
  });

  // Local states for UI management
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
    updateDeviceStatus();
    
    // Listen for lock state changes
    const handleLockStateChange = (data) => {
      console.log('🔒 Lock state changed:', data);
      updateDeviceStatus();
      
      // Show alert when device is locked remotely
      if (data.isLocked && data.source === 'remote') {
        Alert.alert(
          '🔒 Device Locked Remotely',
          'Your device has been locked from the dashboard for security.',
          [
            {
              text: 'OK',
              style: 'default'
            },
            {
              text: 'Emergency Unlock',
              style: 'destructive',
              onPress: handleEmergencyUnlock
            }
          ]
        );
      } else if (data.isLocked && data.source === 'auto-lock') {
        Alert.alert(
          '🚨 Auto-Lock Activated',
          'Device locked due to failed authentication attempts.',
          [{ text: 'OK' }]
        );
      } else if (data.isLocked && data.source === 'movement-lock') {
        Alert.alert(
          '📱 Movement Detected',
          'Device locked due to unauthorized movement.',
          [{ text: 'OK' }]
        );
      }
    };
    
    SocketService.on('device-lock-state-changed', handleLockStateChange);
    
    // Cleanup listener on unmount
    return () => {
      SocketService.off('device-lock-state-changed', handleLockStateChange);
    };
  }, []);

  const loadSecuritySettings = () => {
    const securitySettings = SecurityService.getSecuritySettings();
    setSettings(securitySettings);
  };

  const updateDeviceStatus = () => {
    setDeviceStatus({
      isLocked: SecurityService.isLocked(),
      failedAttempts: SecurityService.getFailedAttempts(),
      isAlarmPlaying: false, // You'd get this from SecurityService
    });
  };

  const handleSettingChange = async (setting, value) => {
    if (isUpdating) return; // Prevent concurrent updates
    
    try {
      console.log(`Changing setting ${setting} to ${value}`);
      setIsUpdating(true);
      
      // Update UI immediately for better user experience
      const newSettings = { ...settings, [setting]: value };
      setSettings(newSettings);

      // Update security service
      switch (setting) {
        case 'movementLockEnabled':
          await SecurityService.enableMovementLock(value);
          console.log(`Movement Lock ${value ? 'enabled' : 'disabled'}`);
          break;
        case 'dontTouchLockEnabled':
          await SecurityService.enableDontTouchLock(value);
          console.log(`Don't Touch Lock ${value ? 'enabled' : 'disabled'}`);
          break;
        case 'usbLockEnabled':
          await SecurityService.enableUSBLock(value);
          console.log(`USB Lock ${value ? 'enabled' : 'disabled'}`);
          break;
        case 'appLockEnabled':
          await SecurityService.enableAppLock(value);
          console.log(`App Lock ${value ? 'enabled' : 'disabled'}`);
          break;
        default:
          console.warn(`Unknown setting: ${setting}`);
      }
      
    } catch (error) {
      console.error(`Failed to change setting ${setting}:`, error);
      
      // Revert UI change if the service call failed
      loadSecuritySettings();
      
      Alert.alert(
        'Error',
        `Failed to update ${setting}. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const triggerTestAlarm = () => {
    Alert.alert(
      'Test Alarm',
      'This will trigger a test alarm for 10 seconds. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: () => SecurityService.triggerAlarm(10)
        },
      ]
    );
  };

  const handleEmergencyUnlock = async () => {
    const success = await SecurityService.unlockDevice();
    if (success) {
      Alert.alert('Success', 'Device unlocked successfully');
      updateDeviceStatus();
    } else {
      Alert.alert('Failed', 'Failed to unlock device');
    }
  };

  const simulatePowerButtonPress = () => {
    SecurityService.handlePowerButtonPress();
    Alert.alert('Power Button', 'Power button press simulated. Press 3 times quickly to trigger SOS.');
  };

  const SecurityToggle = ({ title, description, value, onValueChange, icon }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#007AFF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => {
          console.log(`Toggle ${title} changed from ${value} to ${newValue}`);
          if (!isUpdating && newValue !== value) {
            onValueChange(newValue);
          }
        }}
        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
        ios_backgroundColor="#E5E5EA"
        disabled={isUpdating}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Security Features</Text>
        <Text style={styles.headerSubtitle}>
          Configure advanced security settings for your device
        </Text>
      </View>

      {/* Device Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Status</Text>
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Ionicons 
              name={deviceStatus.isLocked ? "lock-closed" : "lock-open"} 
              size={20} 
              color={deviceStatus.isLocked ? "#FF3B30" : "#34C759"} 
            />
            <Text style={styles.statusText}>
              {deviceStatus.isLocked ? "Locked" : "Unlocked"}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="warning" size={20} color="#FF9500" />
            <Text style={styles.statusText}>
              Failed Attempts: {deviceStatus.failedAttempts}
            </Text>
          </View>
          {settings.dontTouchLockEnabled && (
            <View style={styles.statusItem}>
              <Ionicons name="eye" size={20} color="#FF3B30" />
              <Text style={[styles.statusText, { color: '#FF3B30' }]}>
                Don't Touch Active
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.testButton]}
            onPress={triggerTestAlarm}
          >
            <Ionicons name="volume-high" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Test Alarm</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.sosButton]}
            onPress={simulatePowerButtonPress}
          >
            <Ionicons name="warning" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Test SOS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#8E8E93' }]}
            onPress={() => {
              console.log('Current Security Settings:', settings);
              Alert.alert(
                'Security Status',
                `Don't Touch: ${settings.dontTouchLockEnabled ? 'ON' : 'OFF'}\nMovement Lock: ${settings.movementLockEnabled ? 'ON' : 'OFF'}\nUSB Lock: ${settings.usbLockEnabled ? 'ON' : 'OFF'}\nApp Lock: ${settings.appLockEnabled ? 'ON' : 'OFF'}\nUpdating: ${isUpdating ? 'YES' : 'NO'}`,
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="information-circle" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Status</Text>
          </TouchableOpacity>
          
          {deviceStatus.isLocked && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.unlockButton]}
              onPress={handleEmergencyUnlock}
            >
              <Ionicons name="lock-open" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Emergency Unlock</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <SecurityToggle
          title="Movement Lock"
          description="Lock device when movement is detected"
          value={settings.movementLockEnabled}
          onValueChange={(value) => {
            handleSettingChange('movementLockEnabled', value);
            if (value) {
              setTimeout(() => {
                Alert.alert(
                  'Movement Lock Enabled',
                  'Your device will now lock and trigger an alarm if significant movement is detected. There is a 5-second grace period to prevent false triggers.',
                  [{ text: 'OK' }]
                );
              }, 200);
            }
          }}
          icon="walk"
        />

        <SecurityToggle
          title="Don't Touch Lock"
          description="Trigger alarm and capture photo when device is touched/moved while charging or unattended"
          value={settings.dontTouchLockEnabled}
          onValueChange={(value) => {
            handleSettingChange('dontTouchLockEnabled', value);
            if (value) {
              setTimeout(() => {
                Alert.alert(
                  'Don\'t Touch Lock Enabled',
                  'Your device will now trigger an alarm and capture photos if someone tries to move or touch it. Perfect for protecting your device while charging in public places. There is a 5-second grace period.',
                  [{ text: 'OK' }]
                );
              }, 200);
            }
          }}
          icon="hand-left"
        />

        <SecurityToggle
          title="USB Lock"
          description="Block unauthorized USB access"
          value={settings.usbLockEnabled}
          onValueChange={(value) => handleSettingChange('usbLockEnabled', value)}
          icon="hardware-chip"
        />

        <SecurityToggle
          title="App Lock"
          description="Protect apps with additional security"
          value={settings.appLockEnabled}
          onValueChange={(value) => handleSettingChange('appLockEnabled', value)}
          icon="apps"
        />
      </View>

      {/* Biometric Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Biometric Authentication</Text>
        <View style={styles.biometricInfo}>
          <Ionicons 
            name={settings.biometricAvailable ? "checkmark-circle" : "close-circle"} 
            size={20} 
            color={settings.biometricAvailable ? "#34C759" : "#FF3B30"} 
          />
          <Text style={styles.biometricText}>
            {settings.biometricAvailable ? "Available and configured" : "Not available or not configured"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  sosButton: {
    backgroundColor: '#FF3B30',
  },
  unlockButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  biometricText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default SecurityScreen;
