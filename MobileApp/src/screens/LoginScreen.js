import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../slices/authSlice';
import { API_ENDPOINTS } from '../config/api';
import { DeviceIdentityService } from '../services/DeviceIdentityService';
import SocketService from '../services/SocketService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    dispatch(loginStart());

    try {
      console.log('Attempting login with URL:', API_ENDPOINTS.LOGIN);
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: email, password }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        dispatch(loginSuccess({ token: data.token, user: data.user }));
        
        // Generate and store device code for manual registration
        await generateDeviceCode();
        
        // Connect socket service for real-time communication
        try {
          await SocketService.connect();
          console.log('Socket service connected after login');
        } catch (socketError) {
          console.error('Failed to connect socket after login:', socketError);
        }
        
        // AuthNavigator will automatically handle routing based on activation status
        console.log('Login successful, AuthNavigator will handle routing');
      } else {
        dispatch(loginFailure(data.message || 'Login failed'));
        Alert.alert('Error', data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch(loginFailure('Network error'));
      Alert.alert('Error', `Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceCode = async () => {
    try {
      // Use centralized device identity service
      const deviceInfo = await DeviceIdentityService.getDeviceInfo();
      console.log('Device code generated:', deviceInfo.deviceCode);
      console.log('Complete device info stored:', deviceInfo);
    } catch (error) {
      console.error('Error generating device code:', error);
    }
  };

  const getDeviceInfo = async () => {
    try {
      const deviceName = Device.deviceName || `${Device.brand} ${Device.modelName}`;
      const deviceId = Device.osBuildId || Device.osInternalBuildId || `mobile_${Date.now()}`;
      
      return {
        deviceId: deviceId.substring(0, 15).padEnd(15, '0'), // Ensure 15 characters
        deviceName: deviceName.substring(0, 50), // Limit device name length
        deviceType: 'mobile',
        platform: Platform.OS,
        appVersion: '1.0.0'
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      return {
        deviceId: `mobile_${Date.now()}`.substring(0, 15).padEnd(15, '0'),
        deviceName: 'Mobile Device',
        deviceType: 'mobile',
        platform: Platform.OS,
        appVersion: '1.0.0'
      };
    }
  };

  const generateHashCode = (deviceId) => {
    // Generate a simple hash-like code from device ID
    const chars = '0123456789ABCDEF';
    let hash = 0;
    
    for (let i = 0; i < deviceId.length; i++) {
      const char = deviceId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to positive number and create 4-part code
    const positiveHash = Math.abs(hash);
    const part1 = (positiveHash % 10000).toString().padStart(4, '0');
    const part2 = ((positiveHash >> 4) % 10000).toString().padStart(4, '0');
    const part3 = ((positiveHash >> 8) % 10000).toString().padStart(4, '0');
    
    return `${part1}-${part2}-${part3}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>TrackerApp</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default LoginScreen;
