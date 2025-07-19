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
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import SecurityService from '../services/SecurityService';

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

  // Local slider states to prevent flickering
  const [localMovementThreshold, setLocalMovementThreshold] = useState(1.5);
  const [localMaxFailedAttempts, setLocalMaxFailedAttempts] = useState(3);
  const [sliderDebounceTimer, setSliderDebounceTimer] = useState(null);

  useEffect(() => {
    loadSecuritySettings();
    updateDeviceStatus();
  }, []);

  // Update local states when settings change
  useEffect(() => {
    setLocalMovementThreshold(settings.movementThreshold);
    setLocalMaxFailedAttempts(settings.maxFailedAttempts);
  }, [settings.movementThreshold, settings.maxFailedAttempts]);

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
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);

    // Update security service
    switch (setting) {
      case 'movementLockEnabled':
        await SecurityService.enableMovementLock(value);
        break;
      case 'dontTouchLockEnabled':
        await SecurityService.enableDontTouchLock(value);
        break;
      case 'usbLockEnabled':
        await SecurityService.enableUSBLock(value);
        break;
      case 'appLockEnabled':
        await SecurityService.enableAppLock(value);
        break;
      case 'movementThreshold':
        await SecurityService.setMovementThreshold(value);
        break;
      case 'maxFailedAttempts':
        await SecurityService.setMaxFailedAttempts(value);
        break;
    }
  };

  // Debounced handler for slider changes
  const handleSliderChange = (setting, value) => {
    // Clear existing timer
    if (sliderDebounceTimer) {
      clearTimeout(sliderDebounceTimer);
    }

    // Update local state immediately for smooth UI
    if (setting === 'movementThreshold') {
      setLocalMovementThreshold(value);
    } else if (setting === 'maxFailedAttempts') {
      setLocalMaxFailedAttempts(Math.round(value));
    }

    // Set new timer to update actual settings
    setSliderDebounceTimer(setTimeout(() => {
      handleSettingChange(setting, setting === 'maxFailedAttempts' ? Math.round(value) : value);
    }, 300)); // 300ms debounce
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
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  const SecuritySlider = ({ title, description, value, onValueChange, minimum, maximum, step, icon }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#007AFF" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={minimum}
            maximumValue={maximum}
            value={value}
            onValueChange={onValueChange}
            step={step}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E5E5EA"
            thumbStyle={{ backgroundColor: '#007AFF' }}
          />
          <Text style={styles.sliderValue}>{step < 1 ? value.toFixed(1) : Math.round(value)}</Text>
        </View>
      </View>
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
          onValueChange={(value) => handleSettingChange('movementLockEnabled', value)}
          icon="walk"
        />

        <SecurityToggle
          title="Don't Touch Lock"
          description="Trigger alarm when device is touched/moved"
          value={settings.dontTouchLockEnabled}
          onValueChange={(value) => handleSettingChange('dontTouchLockEnabled', value)}
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

        <SecuritySlider
          title="Movement Sensitivity"
          description="Adjust movement detection sensitivity"
          value={localMovementThreshold}
          onValueChange={(value) => handleSliderChange('movementThreshold', value)}
          minimum={0.1}
          maximum={5.0}
          step={0.1}
          icon="speedometer"
        />

        <SecuritySlider
          title="Max Failed Attempts"
          description="Number of failed attempts before auto-lock"
          value={localMaxFailedAttempts}
          onValueChange={(value) => handleSliderChange('maxFailedAttempts', value)}
          minimum={1}
          maximum={10}
          step={1}
          icon="shield"
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 12,
    minWidth: 40,
    textAlign: 'right',
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
