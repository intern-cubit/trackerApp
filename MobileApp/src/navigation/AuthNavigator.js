import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DeviceRegistrationScreen from '../screens/DeviceRegistrationScreen';
import MainTabNavigator from '../screens/MainTabNavigator';
import LockScreen from '../screens/LockScreen';

// Services
import { DeviceIdentityService } from '../services/DeviceIdentityService';
import SecurityService from '../services/SecurityService';
import SocketService from '../services/SocketService';
import { API_ENDPOINTS } from '../config/api';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceActivated, setIsDeviceActivated] = useState(false);
  const [isDeviceLocked, setIsDeviceLocked] = useState(false);

  useEffect(() => {
    checkActivationStatus();
    checkLockStatus();
    
    // Listen for lock state changes
    const handleLockStateChange = (data) => {
      console.log('🔒 Navigation received lock state change:', data);
      setIsDeviceLocked(data.isLocked);
    };
    
    SocketService.on('device-lock-state-changed', handleLockStateChange);
    
    return () => {
      SocketService.off('device-lock-state-changed', handleLockStateChange);
    };
  }, [isAuthenticated]);

  const checkLockStatus = () => {
    const lockStatus = SecurityService.isLocked();
    console.log('📱 Current device lock status:', lockStatus);
    setIsDeviceLocked(lockStatus);
  };

  // Listen for activation state changes when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        checkActivationStatus();
        checkLockStatus();
      }
    }, [isAuthenticated])
  );

  const handleUnlock = () => {
    console.log('🔓 Device unlocked from lock screen');
    setIsDeviceLocked(false);
  };

  const checkActivationStatus = async () => {
    try {
      if (isAuthenticated) {
        console.log('Checking device activation status...');
        
        // Get device code from centralized service
        const deviceInfo = await DeviceIdentityService.getDeviceInfo();
        const deviceCode = deviceInfo?.deviceCode;
        
        if (!deviceCode) {
          console.log('No device code found, device not activated');
          setIsDeviceActivated(false);
          setIsLoading(false);
          return;
        }

        // Check with backend if device is activated
        const response = await fetch(API_ENDPOINTS.VALIDATE_DEVICE_CODE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceCode: deviceCode,
            deviceName: deviceInfo?.deviceName || 'Mobile Device'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const isActivated = data.device?.activationStatus === 'active';
          const isPending = data.device?.activationStatus === 'pending';
          
          console.log('Device activation status from backend:', data.device?.activationStatus);
          setIsDeviceActivated(isActivated);
          
          // Update local storage to reflect backend status
          await AsyncStorage.setItem('deviceActivated', isActivated.toString());
          
          // If device is pending activation, user should see registration screen to enter activation key
          if (isPending) {
            console.log('Device is pending activation - showing registration screen');
            setIsDeviceActivated(false); // Keep showing registration screen for activation key input
          }
        } else {
          console.log('Device not found in backend or validation failed');
          setIsDeviceActivated(false);
          await AsyncStorage.setItem('deviceActivated', 'false');
        }
      }
    } catch (error) {
      console.error('Error checking activation status:', error);
      // Default to not activated on error
      setIsDeviceActivated(false);
      await AsyncStorage.setItem('deviceActivated', 'false');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Authentication flow
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : isDeviceLocked ? (
        // Device is locked - show lock screen
        <Stack.Screen name="LockScreen">
          {(props) => <LockScreen {...props} onUnlock={handleUnlock} />}
        </Stack.Screen>
      ) : !isDeviceActivated ? (
        // Device activation required (no skip option)
        <Stack.Screen 
          name="DeviceRegistration" 
          component={DeviceRegistrationScreen}
          options={{ 
            headerShown: true,
            title: 'Device Activation Required',
            headerBackVisible: false, // Prevent going back
          }}
        />
      ) : (
        // Main app (user is logged in and device is activated)
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AuthNavigator;
