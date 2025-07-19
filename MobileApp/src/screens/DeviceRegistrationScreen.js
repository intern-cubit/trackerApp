import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { API_ENDPOINTS } from '../config/api';
import LocationService from '../services/LocationService';
import { DeviceIdentityService } from '../services/DeviceIdentityService';

const DeviceRegistrationScreen = ({ navigation }) => {
  const [deviceCode, setDeviceCode] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('unregistered'); // unregistered, registered, pending, activated

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  useEffect(() => {
    if (deviceCode) {
      checkDeviceStatus();
    }
  }, [deviceCode]);

  const loadDeviceInfo = async () => {
    try {
      // Check for old device code format with hyphens and clear if found
      const existingDeviceCode = await AsyncStorage.getItem('deviceCode');
      if (existingDeviceCode && existingDeviceCode.includes('-')) {
        console.log('Found old device code with hyphens, clearing storage:', existingDeviceCode);
        await AsyncStorage.multiRemove(['deviceCode', 'deviceInfo']);
      }

      // Check for old device info with hyphenated device codes
      const existingDeviceInfo = await AsyncStorage.getItem('deviceInfo');
      if (existingDeviceInfo) {
        try {
          const parsedInfo = JSON.parse(existingDeviceInfo);
          if (parsedInfo.deviceCode && parsedInfo.deviceCode.includes('-')) {
            console.log('Found old device info with hyphenated code, clearing storage:', parsedInfo.deviceCode);
            await AsyncStorage.multiRemove(['deviceCode', 'deviceInfo']);
          }
        } catch (parseError) {
          console.log('Error parsing existing device info, clearing storage');
          await AsyncStorage.multiRemove(['deviceCode', 'deviceInfo']);
        }
      }

      // Use centralized device identity service
      const storedDeviceInfo = await DeviceIdentityService.getDeviceInfo();
      
      if (storedDeviceInfo && storedDeviceInfo.deviceCode) {
        setDeviceCode(storedDeviceInfo.deviceCode);
        setDeviceInfo(storedDeviceInfo);
      } else {
        // Generate new device info if none exists
        await generateDeviceCode();
      }
    } catch (error) {
      console.error('Error loading device info:', error);
      await generateDeviceCode();
    }
  };

  const generateDeviceCode = async () => {
    try {
      // Use centralized device identity service
      const deviceInfo = await DeviceIdentityService.getDeviceInfo();
      setDeviceCode(deviceInfo.deviceCode);
      setDeviceInfo(deviceInfo);
      
      console.log('Device code generated:', deviceInfo.deviceCode);
    } catch (error) {
      console.error('Error generating device code:', error);
    }
  };

  const checkDeviceStatus = async (codeToCheck = null) => {
    try {
      const code = codeToCheck || deviceCode;
      if (!code) {
        console.log('No device code available for status check');
        setDeviceStatus('unregistered');
        return;
      }

      console.log('Checking device status for code:', code);

      const response = await fetch(API_ENDPOINTS.VALIDATE_DEVICE_CODE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceCode: code,
          deviceName: deviceInfo?.deviceName || 'Mobile Device'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Device validation response:', data);
        
        if (data.device?.activationStatus === 'active') {
          console.log('Device is activated');
          setDeviceStatus('activated');
        } else if (data.device?.activationStatus === 'pending') {
          console.log('Device activation is pending');
          setDeviceStatus('pending');
        } else {
          console.log('Device found but not activated');
          setDeviceStatus('registered');
        }
      } else {
        console.log('Device not found in database or validation failed:', response.status);
        const errorData = await response.json();
        console.log('Error response:', errorData);
        
        // If device is not found in database, it needs to be registered first
        setDeviceStatus('unregistered');
      }
    } catch (error) {
      console.error('Error checking device status:', error);
      // Default to unregistered on network error
      setDeviceStatus('unregistered');
    }
  };

  const registerDevice = async () => {
    try {
      if (!deviceCode || !deviceInfo) {
        Alert.alert('Error', 'Device information not available');
        return;
      }

      setIsRegistering(true);
      console.log('Registering device:', deviceCode);

      const response = await fetch(API_ENDPOINTS.REGISTER_MOBILE_DEVICE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceCode: deviceCode,
          deviceName: deviceInfo.deviceName,
          deviceId: deviceCode, // Use device code as deviceId (no hyphens to remove)
          platform: deviceInfo.platform,
          deviceType: 'mobile'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Device registered successfully');
        setDeviceStatus('registered');
        Alert.alert('Success', 'Device registered successfully! You can now request activation from your administrator.');
      } else {
        console.error('Registration failed:', data);
        Alert.alert('Error', data.message || 'Failed to register device');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Network error occurred during registration');
    } finally {
      setIsRegistering(false);
    }
  };

  const activateDevice = async () => {
    try {
      if (!deviceCode || !activationKey.trim()) {
        Alert.alert('Error', 'Please enter the activation key');
        return;
      }

      setIsActivating(true);

      const response = await fetch(API_ENDPOINTS.ACTIVATE_DEVICE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceCode: deviceCode,
          activationKey: activationKey.trim(),
          deviceName: deviceInfo?.deviceName || 'Mobile Device'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Device activated successfully!', [
          {
            text: 'OK',
            onPress: async () => {
              setDeviceStatus('activated');
              // Store device ID from response for socket connection
              if (data.device && data.device._id) {
                await AsyncStorage.setItem('deviceId', data.device._id);
                console.log('Device ID stored for socket connection:', data.device._id);
              }
              // Update activation status in storage
              await AsyncStorage.setItem('deviceActivated', 'true');
              // Start location tracking after activation
              LocationService.startTracking();
              navigation.navigate('Tracking');
            }
          }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to activate device');
      }
    } catch (error) {
      console.error('Activation error:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setIsActivating(false);
    }
  };

  const copyDeviceCode = async () => {
    try {
      await Clipboard.setStringAsync(deviceCode);
      Alert.alert('Copied', 'Device code copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy device code');
    }
  };

  const renderActivationSection = () => {
    if (deviceStatus === 'activated') {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          <Text style={styles.statusTitle}>Device Activated</Text>
          <Text style={styles.statusSubtitle}>Your device is ready for tracking</Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('Tracking')}
          >
            <Text style={styles.continueButtonText}>Continue to Tracking</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (deviceStatus === 'unregistered') {
      return (
        <View style={styles.activationContainer}>
          <Text style={styles.sectionTitle}>Register Your Device</Text>
          <Text style={styles.instruction}>
            First, register your device with the system before activation
          </Text>
          
          <TouchableOpacity
            style={[styles.activateButton, !deviceCode && styles.disabledButton]}
            onPress={registerDevice}
            disabled={isRegistering || !deviceCode}
          >
            {isRegistering ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.activateButtonText}>Register Device</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (deviceStatus === 'registered') {
      return (
        <View style={styles.activationContainer}>
          <Text style={styles.sectionTitle}>Activate Your Device</Text>
          <Text style={styles.instruction}>
            Your device is registered. Enter the activation key provided by your administrator
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter activation key"
            value={activationKey}
            onChangeText={setActivationKey}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={activateDevice}
          />

          <TouchableOpacity
            style={[styles.activateButton, (!deviceCode || !activationKey.trim()) && styles.disabledButton]}
            onPress={activateDevice}
            disabled={isActivating || !deviceCode || !activationKey.trim()}
          >
            {isActivating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.activateButtonText}>Activate Device</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (deviceStatus === 'pending') {
      return (
        <View style={styles.activationContainer}>
          <Text style={styles.sectionTitle}>Ready for Activation</Text>
          <Text style={styles.instruction}>
            Your device has been assigned! Enter the activation key provided by your administrator to complete the setup.
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter activation key (e.g. ABCD-1234)"
            value={activationKey}
            onChangeText={setActivationKey}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={activateDevice}
          />

          <TouchableOpacity
            style={[styles.activateButton, (!deviceCode || !activationKey.trim()) && styles.disabledButton]}
            onPress={activateDevice}
            disabled={isActivating || !deviceCode || !activationKey.trim()}
          >
            {isActivating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.activateButtonText}>Activate Device</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => checkDeviceStatus()}
          >
            <Text style={styles.refreshButtonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderDeviceCodeSection = () => (
    <View style={styles.deviceCodeContainer}>
      <Text style={styles.sectionTitle}>Device Code</Text>
      <Text style={styles.instruction}>
        Share this code with your administrator for device registration
      </Text>
      
      <View style={styles.codeContainer}>
        <Text style={styles.deviceCodeText}>{deviceCode}</Text>
        <TouchableOpacity onPress={copyDeviceCode} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDeviceInfoSection = () => (
    deviceInfo && (
      <View style={styles.deviceInfoContainer}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.deviceInfoLabel}>Device Name:</Text>
          <Text style={styles.deviceInfoValue}>{deviceInfo.deviceName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.deviceInfoLabel}>Platform:</Text>
          <Text style={styles.deviceInfoValue}>{Platform.OS}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.deviceInfoLabel}>Device Type:</Text>
          <Text style={styles.deviceInfoValue}>Mobile Device</Text>
        </View>
      </View>
    )
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Registration</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {renderDeviceCodeSection()}
        {renderActivationSection()}
        {renderDeviceInfoSection()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    padding: 20,
  },
  deviceCodeContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  deviceCodeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  activationContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  activateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  activateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  pendingText: {
    marginLeft: 8,
    color: '#FF9800',
    fontWeight: '500',
  },
  statusContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  deviceInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  deviceInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
});

export default DeviceRegistrationScreen;
