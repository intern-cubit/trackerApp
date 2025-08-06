import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SecurityService from '../services/SecurityService';
import SocketService from '../services/SocketService';

const { width, height } = Dimensions.get('window');

const SecurityScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    maxFailedAttempts: 3,
    movementLockEnabled: false,
    dontTouchLockEnabled: false,
    usbLockEnabled: false,
    appLockEnabled: false,
    screenLockEnabled: false,
    preventUninstall: true,
    movementThreshold: 3.5,
    biometricAvailable: false,
    performanceBoostEnabled: false,
    sosEnabled: false,
    remoteResetEnabled: false,
  });

  const [deviceStatus, setDeviceStatus] = useState({
    isLocked: false,
    failedAttempts: 0,
    isAlarmPlaying: false,
    isInitialized: false,
  });

  // Local states for UI management
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [lastBoostTime, setLastBoostTime] = useState(null);

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

    const handlePerformanceBoost = (data) => {
      setLastBoostTime(new Date(data.timestamp));
      Alert.alert(
        '⚡ Performance Boost',
        `System optimized in ${data.duration}ms`,
        [{ text: 'OK' }]
      );
    };
    
    SocketService.on('device-lock-state-changed', handleLockStateChange);
    SocketService.on('performance-boost-completed', handlePerformanceBoost);
    
    // Cleanup listener on unmount
    return () => {
      SocketService.off('device-lock-state-changed', handleLockStateChange);
      SocketService.off('performance-boost-completed', handlePerformanceBoost);
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
      isInitialized: SecurityService.isInitialized,
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
        case 'screenLockEnabled':
          await SecurityService.enableScreenLock(value);
          console.log(`Screen Lock ${value ? 'enabled' : 'disabled'}`);
          break;
        case 'preventUninstall':
          await SecurityService.enableUninstallPrevention(value);
          console.log(`Uninstall Prevention ${value ? 'enabled' : 'disabled'}`);
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

  const handleThresholdChange = async (threshold) => {
    try {
      const numValue = parseFloat(threshold);
      if (isNaN(numValue) || numValue < 0.5 || numValue > 10) {
        Alert.alert('Invalid Value', 'Movement threshold must be between 0.5 and 10');
        return;
      }
      
      await SecurityService.setMovementThreshold(numValue);
      setSettings(prev => ({ ...prev, movementThreshold: numValue }));
      
    } catch (error) {
      console.error('Error updating threshold:', error);
      Alert.alert('Error', 'Failed to update movement threshold');
    }
  };

  const handleMaxAttemptsChange = async (attempts) => {
    try {
      const numValue = parseInt(attempts);
      if (isNaN(numValue) || numValue < 1 || numValue > 10) {
        Alert.alert('Invalid Value', 'Max attempts must be between 1 and 10');
        return;
      }
      
      await SecurityService.setMaxFailedAttempts(numValue);
      setSettings(prev => ({ ...prev, maxFailedAttempts: numValue }));
      
    } catch (error) {
      console.error('Error updating max attempts:', error);
      Alert.alert('Error', 'Failed to update max attempts');
    }
  };

  const handlePerformanceBoost = async () => {
    try {
      Alert.alert(
        '⚡ Performance Boost',
        'This will clear cache and optimize system performance. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Boost Now',
            onPress: async () => {
              const result = await SecurityService.optimizePerformance();
              setLastBoostTime(new Date());
              Alert.alert('Success', result.message);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error triggering performance boost:', error);
      Alert.alert('Error', 'Failed to trigger performance boost');
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

  const renderSecurityCard = (title, description, value, onValueChange, icon, critical = false) => (
    <View style={[styles.securityCard, critical && styles.criticalCard]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, critical && styles.criticalIconContainer]}>
          <Ionicons name={icon} size={24} color={critical ? '#d63031' : '#00b894'} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={[styles.cardTitle, critical && styles.criticalTitle]}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={(newValue) => {
            console.log(`Toggle ${title} changed from ${value} to ${newValue}`);
            if (!isUpdating && newValue !== value) {
              onValueChange(newValue);
            }
          }}
          trackColor={{ false: '#ddd6fe', true: critical ? '#ffeaa7' : '#81ecec' }}
          thumbColor={value ? (critical ? '#d63031' : '#00b894') : '#ffffff'}
          ios_backgroundColor="#ddd6fe"
          disabled={isUpdating}
          style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
        />
      </View>
    </View>
  );

  const renderTestModal = () => (
    <Modal
      visible={showTestModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTestModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🧪 Security Testing</Text>
          <Text style={styles.modalSubtitle}>
            Test security features (for development only)
          </Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.modalTestButton]}
            onPress={() => {
              triggerTestAlarm();
              setShowTestModal(false);
            }}
          >
            <Ionicons name="volume-high" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test Alarm</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, styles.modalTestButton]}
            onPress={() => {
              simulatePowerButtonPress();
              setShowTestModal(false);
            }}
          >
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test SOS Alert</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, styles.modalTestButton, { backgroundColor: '#636e72' }]}
            onPress={() => setShowTestModal(false)}
          >
            <Text style={styles.testButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔐 Enhanced Security</Text>
          <Text style={styles.subtitle}>Advanced Protection & Controls</Text>
          
          {/* Status Indicator */}
          <View style={[styles.statusContainer, deviceStatus.isLocked && styles.lockedStatus]}>
            <Ionicons 
              name={deviceStatus.isLocked ? "lock-closed" : "shield-checkmark"} 
              size={16} 
              color={deviceStatus.isLocked ? "#ff4444" : "#4CAF50"} 
            />
            <Text style={[styles.statusText, deviceStatus.isLocked && styles.lockedStatusText]}>
              {deviceStatus.isLocked ? `Locked (${deviceStatus.failedAttempts} attempts)` : 'Protected'}
            </Text>
          </View>
        </View>

        {/* Device Lock Status */}
        {deviceStatus.isLocked && (
          <View style={styles.lockAlert}>
            <View style={styles.lockAlertIcon}>
              <Ionicons name="warning" size={24} color="#d63031" />
            </View>
            <View style={styles.lockAlertContent}>
              <Text style={styles.lockAlertTitle}>Device Currently Locked</Text>
              <Text style={styles.lockAlertText}>
                Failed attempts: {deviceStatus.failedAttempts}
              </Text>
            </View>
            <TouchableOpacity style={styles.unlockButton} onPress={handleEmergencyUnlock}>
              <Ionicons name="lock-open" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.unlockButtonText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
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
              style={[styles.actionButton, styles.boostButton]}
              onPress={handlePerformanceBoost}
            >
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Boost Performance</Text>
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
          
          {lastBoostTime && (
            <Text style={styles.lastBoostText}>
              Last boost: {lastBoostTime.toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Auto-Lock Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Auto-Lock Protection</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Max Failed Attempts:</Text>
            <TextInput
              style={styles.numberInput}
              value={settings.maxFailedAttempts.toString()}
              onChangeText={handleMaxAttemptsChange}
              keyboardType="numeric"
              placeholder="3"
              placeholderTextColor="#b2bec3"
              selectionColor="#74b9ff"
            />
          </View>
        </View>

        {/* Movement Lock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Movement Lock</Text>
          
          {renderSecurityCard(
            'Movement Detection Lock',
            'Lock device when unauthorized movement is detected',
            settings.movementLockEnabled,
            (value) => {
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
            },
            'phone-portrait'
          )}
          
          {settings.movementLockEnabled && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Movement Threshold:</Text>
              <TextInput
                style={styles.numberInput}
                value={settings.movementThreshold.toString()}
                onChangeText={handleThresholdChange}
                keyboardType="numeric"
                placeholder="3.5"
                placeholderTextColor="#b2bec3"
                selectionColor="#74b9ff"
              />
              <Text style={styles.inputHint}>Higher = less sensitive (recommended: 3.5)</Text>
            </View>
          )}
        </View>

        {/* Movement Alarm (Don't Touch) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Movement Alarm</Text>
          
          {renderSecurityCard(
            'Don\'t Touch Lock',
            'Trigger alarm and capture photo when device is touched/moved while charging or unattended',
            settings.dontTouchLockEnabled,
            (value) => {
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
            },
            'hand-left'
          )}
        </View>

        {/* Hardware Protection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔌 Hardware Protection</Text>
          
          {renderSecurityCard(
            'USB Lock',
            'Prevent unauthorized USB access to device files',
            settings.usbLockEnabled,
            (value) => handleSettingChange('usbLockEnabled', value),
            'hardware-chip'
          )}
          
          {renderSecurityCard(
            'Enhanced Screen Lock',
            'Override system screen lock for better security control',
            settings.screenLockEnabled,
            (value) => handleSettingChange('screenLockEnabled', value),
            'phone-landscape'
          )}
        </View>

        {/* App Protection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 App Protection</Text>
          
          {renderSecurityCard(
            'App Lock',
            'Prevent unauthorized access to sensitive apps',
            settings.appLockEnabled,
            (value) => handleSettingChange('appLockEnabled', value),
            'apps'
          )}
          
          {renderSecurityCard(
            'Prevent App Deletion',
            'Block unauthorized uninstallation of this app',
            settings.preventUninstall,
            (value) => handleSettingChange('preventUninstall', value),
            'shield',
            true
          )}
        </View>

        {/* Test Controls (Development Only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.testControlButton} 
              onPress={() => setShowTestModal(true)}
            >
              <Ionicons name="bug" size={20} color="#fff" />
              <Text style={styles.testControlText}>Security Testing (Dev Only)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Biometric Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Biometric Authentication</Text>
          <View style={styles.biometricInfo}>
            <View style={[styles.biometricIconContainer, settings.biometricAvailable && styles.biometricAvailable]}>
              <Ionicons 
                name={settings.biometricAvailable ? "checkmark-circle" : "close-circle"} 
                size={24} 
                color={settings.biometricAvailable ? "#00b894" : "#ff7675"} 
              />
            </View>
            <Text style={styles.biometricText}>
              {settings.biometricAvailable ? "Available and configured" : "Not available or not configured"}
            </Text>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔐 Enhanced Security Service v2.0
          </Text>
          <Text style={styles.footerSubtext}>
            Status: {deviceStatus.isInitialized ? 'Active' : 'Initializing...'}
          </Text>
        </View>
      </ScrollView>
      
      {renderTestModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '400',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
    minWidth: 180,
    backdropFilter: 'blur(10px)',
  },
  lockedStatus: {
    backgroundColor: 'rgba(255,82,82,0.25)',
  },
  statusText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  lockedStatusText: {
    color: '#ffcdd2',
  },
  lockAlert: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderLeftColor: '#ff4757',
    shadowColor: '#ff4757',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lockAlertIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(214,48,49,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockAlertContent: {
    flex: 1,
    marginLeft: 15,
  },
  lockAlertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 2,
  },
  lockAlertText: {
    fontSize: 15,
    color: '#636e72',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  securityCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  criticalCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#ff4757',
    backgroundColor: '#fff9f9',
    borderColor: 'rgba(255,71,87,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,184,148,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  criticalIconContainer: {
    backgroundColor: 'rgba(214,48,49,0.1)',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  criticalTitle: {
    color: '#d63031',
  },
  cardDescription: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
  },
  numberInput: {
    borderWidth: 2,
    borderColor: '#e0e6ed',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8fafb',
    color: '#2d3436',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 13,
    color: '#74b9ff',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    minWidth: (width - 64) / 2, // Responsive width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  testButton: {
    backgroundColor: '#0984e3',
  },
  sosButton: {
    backgroundColor: '#e17055',
  },
  boostButton: {
    backgroundColor: '#fdcb6e',
  },
  unlockButton: {
    backgroundColor: '#00b894',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  lastBoostText: {
    textAlign: 'center',
    color: '#74b9ff',
    fontSize: 13,
    marginTop: 16,
    fontStyle: 'italic',
  },
  testControlButton: {
    backgroundColor: '#a29bfe',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  testControlText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  biometricInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  biometricIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,118,117,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricAvailable: {
    backgroundColor: 'rgba(0,184,148,0.1)',
  },
  biometricText: {
    marginLeft: 16,
    fontSize: 15,
    color: '#636e72',
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    padding: 25,
    alignItems: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 15,
    color: '#74b9ff',
    textAlign: 'center',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 13,
    color: '#b2bec3',
    textAlign: 'center',
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#2d3436',
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalTestButton: {
    marginBottom: 12,
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default SecurityScreen;
