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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EnhancedSecurityService from '../services/EnhancedSecurityService';
import SocketService from '../services/SocketService';

const { width, height } = Dimensions.get('window');

const EnhancedSecurityScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    autoLockEnabled: true,
    maxFailedAttempts: 3,
    movementLockEnabled: false,
    movementThreshold: 2.0,
    usbLockEnabled: false,
    screenLockEnabled: false,
    performanceBoostEnabled: false,
    appLockEnabled: false,
    preventUninstall: true,
    remoteResetEnabled: false,
    sosEnabled: false,
    dontTouchLockEnabled: false,
    touchSensitivity: 2000
  });

  const [deviceStatus, setDeviceStatus] = useState({
    isLocked: false,
    failedAttempts: 0,
    isInitialized: false
  });

  const [showTestModal, setShowTestModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastBoostTime, setLastBoostTime] = useState(null);

  useEffect(() => {
    initializeAndLoadSettings();
    
    // Listen for security events
    const handleSecurityEvent = (event) => {
      console.log('🔐 Security event received:', event.type);
      updateDeviceStatus();
      
      if (event.type === 'auto_lock_triggered') {
        Alert.alert(
          '🚨 Auto-Lock Triggered',
          `Device locked after ${event.attempts} failed attempts`,
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
    
    SocketService.on('security-event', handleSecurityEvent);
    SocketService.on('performance-boost-completed', handlePerformanceBoost);
    
    return () => {
      SocketService.off('security-event', handleSecurityEvent);
      SocketService.off('performance-boost-completed', handlePerformanceBoost);
    };
  }, []);

  const initializeAndLoadSettings = async () => {
    try {
      if (!EnhancedSecurityService.isInitialized) {
        await EnhancedSecurityService.initialize();
      }
      
      const currentSettings = EnhancedSecurityService.getSecuritySettings();
      setSettings(currentSettings);
      updateDeviceStatus();
    } catch (error) {
      console.error('Error initializing security service:', error);
      Alert.alert('Error', 'Failed to initialize security service');
    }
  };

  const updateDeviceStatus = () => {
    setDeviceStatus({
      isLocked: EnhancedSecurityService.isLocked(),
      failedAttempts: EnhancedSecurityService.getFailedAttempts(),
      isInitialized: EnhancedSecurityService.isInitialized
    });
  };

  const handleSettingChange = async (setting, value) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      const newSettings = { ...settings, [setting]: value };
      setSettings(newSettings);
      
      await EnhancedSecurityService.updateSettings({ [setting]: value });
      
      // Show confirmation for critical changes
      if (['remoteResetEnabled', 'preventUninstall', 'autoLockEnabled'].includes(setting)) {
        Alert.alert(
          '✅ Setting Updated',
          `${setting} has been ${value ? 'enabled' : 'disabled'}`,
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', `Failed to update ${setting}`);
      // Revert the setting
      setSettings(prev => ({ ...prev, [setting]: !value }));
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
      
      await EnhancedSecurityService.updateSettings({ movementThreshold: numValue });
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
      
      await EnhancedSecurityService.updateSettings({ maxFailedAttempts: numValue });
      setSettings(prev => ({ ...prev, maxFailedAttempts: numValue }));
      
    } catch (error) {
      console.error('Error updating max attempts:', error);
      Alert.alert('Error', 'Failed to update max attempts');
    }
  };

  const handleTouchSensitivityChange = async (sensitivity) => {
    try {
      const numValue = parseInt(sensitivity);
      if (isNaN(numValue) || numValue < 1000 || numValue > 10000) {
        Alert.alert('Invalid Value', 'Touch sensitivity must be between 1000 and 10000 ms');
        return;
      }
      
      await EnhancedSecurityService.updateSettings({ touchSensitivity: numValue });
      setSettings(prev => ({ ...prev, touchSensitivity: numValue }));
      
    } catch (error) {
      console.error('Error updating touch sensitivity:', error);
      Alert.alert('Error', 'Failed to update touch sensitivity');
    }
  };

  const handleUnlockDevice = async () => {
    try {
      await EnhancedSecurityService.unlockDevice('manual');
      updateDeviceStatus();
      Alert.alert('✅ Success', 'Device unlocked successfully');
    } catch (error) {
      console.error('Error unlocking device:', error);
      Alert.alert('Error', 'Failed to unlock device');
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
              await EnhancedSecurityService.triggerTestPerformanceBoost();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error triggering performance boost:', error);
      Alert.alert('Error', 'Failed to trigger performance boost');
    }
  };

  const renderSecurityCard = (title, description, value, onValueChange, icon, critical = false) => (
    <View style={[styles.securityCard, critical && styles.criticalCard]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color={critical ? '#ff4444' : '#4CAF50'} />
        <View style={styles.cardTitleContainer}>
          <Text style={[styles.cardTitle, critical && styles.criticalTitle]}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: critical ? '#ff4444' : '#4CAF50' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
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
            style={styles.testButton}
            onPress={async () => {
              await EnhancedSecurityService.triggerTestAutoLock();
              setShowTestModal(false);
            }}
          >
            <Ionicons name="lock-closed" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test Auto-Lock</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              await EnhancedSecurityService.triggerTestMovementLock();
              setShowTestModal(false);
            }}
          >
            <Ionicons name="phone-portrait" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test Movement Lock</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              await EnhancedSecurityService.triggerTestUSBLock();
              setShowTestModal(false);
            }}
          >
            <Ionicons name="hardware-chip" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test USB Lock</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              await EnhancedSecurityService.triggerSOSManual();
              setShowTestModal(false);
            }}
          >
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test SOS Alert</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              await EnhancedSecurityService.triggerTestDontTouchLock();
              setShowTestModal(false);
            }}
          >
            <Ionicons name="hand-left" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test Don't Touch Lock</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: '#666' }]}
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
            <Ionicons name="warning" size={24} color="#ff4444" />
            <View style={styles.lockAlertContent}>
              <Text style={styles.lockAlertTitle}>Device Currently Locked</Text>
              <Text style={styles.lockAlertText}>
                Failed attempts: {deviceStatus.failedAttempts}
              </Text>
            </View>
            <TouchableOpacity style={styles.unlockButton} onPress={handleUnlockDevice}>
              <Text style={styles.unlockButtonText}>Unlock</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Auto-Lock Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Auto-Lock Protection</Text>
          
          {renderSecurityCard(
            'Auto-Lock After Failed Attempts',
            'Lock device after multiple failed authentication attempts',
            settings.autoLockEnabled,
            (value) => handleSettingChange('autoLockEnabled', value),
            'lock-closed'
          )}
          
          {settings.autoLockEnabled && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Max Failed Attempts:</Text>
              <TextInput
                style={styles.numberInput}
                value={settings.maxFailedAttempts.toString()}
                onChangeText={handleMaxAttemptsChange}
                keyboardType="numeric"
                placeholder="3"
              />
            </View>
          )}
        </View>

        {/* Movement Lock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Movement Lock</Text>
          
          {renderSecurityCard(
            'Movement Detection Lock',
            'Lock device when unauthorized movement is detected',
            settings.movementLockEnabled,
            (value) => handleSettingChange('movementLockEnabled', value),
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
                placeholder="2.0"
              />
              <Text style={styles.inputHint}>Higher = less sensitive</Text>
            </View>
          )}
        </View>

        {/* USB & Hardware Protection */}
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

        {/* Performance & System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Performance & System</Text>
          
          {renderSecurityCard(
            'Performance Booster',
            'Automatically clear cache and optimize system performance',
            settings.performanceBoostEnabled,
            (value) => handleSettingChange('performanceBoostEnabled', value),
            'speedometer'
          )}
          
          <TouchableOpacity style={styles.boostButton} onPress={handlePerformanceBoost}>
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.boostButtonText}>Boost Performance Now</Text>
          </TouchableOpacity>
          
          {lastBoostTime && (
            <Text style={styles.lastBoostText}>
              Last boost: {lastBoostTime.toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Emergency Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆘 Emergency Features</Text>
          
          {renderSecurityCard(
            'SOS Alert (3x Power Button)',
            'Trigger emergency alert by pressing power button 3 times quickly',
            settings.sosEnabled,
            (value) => handleSettingChange('sosEnabled', value),
            'warning'
          )}
          
          {renderSecurityCard(
            'Don\'t Touch Lock',
            'Lock device when unauthorized touch/interaction is detected',
            settings.dontTouchLockEnabled,
            (value) => handleSettingChange('dontTouchLockEnabled', value),
            'hand-left'
          )}
          
          {settings.dontTouchLockEnabled && (
            <View style={styles.thresholdContainer}>
              <Text style={styles.thresholdLabel}>Touch Sensitivity (ms):</Text>
              <TextInput
                style={styles.thresholdInput}
                value={settings.touchSensitivity.toString()}
                onChangeText={(value) => handleTouchSensitivityChange(value)}
                keyboardType="numeric"
                placeholder="2000"
              />
              <Text style={styles.thresholdHint}>
                Higher values = less sensitive (1000-5000ms recommended)
              </Text>
            </View>
          )}
        </View>

        {/* Critical Features */}
        <View style={styles.section}>
          <Text style={styles.criticalSectionTitle}>🚨 Critical Security</Text>
          
          {renderSecurityCard(
            'Remote Factory Reset',
            'Allow remote factory reset from dashboard (IRREVERSIBLE)',
            settings.remoteResetEnabled,
            (value) => handleSettingChange('remoteResetEnabled', value),
            'nuclear',
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
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  lockedStatus: {
    backgroundColor: 'rgba(255,68,68,0.2)',
  },
  statusText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  lockedStatusText: {
    color: '#ffcdd2',
  },
  lockAlert: {
    backgroundColor: '#ffebee',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  lockAlertContent: {
    flex: 1,
    marginLeft: 10,
  },
  lockAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  lockAlertText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  unlockButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  criticalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  securityCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  criticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  criticalTitle: {
    color: '#d32f2f',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  boostButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  boostButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  lastBoostText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  testControlButton: {
    backgroundColor: '#9C27B0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  testControlText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    width: width * 0.85,
    maxHeight: height * 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default EnhancedSecurityScreen;
