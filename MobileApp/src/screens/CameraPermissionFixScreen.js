import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import PermissionManager from '../services/PermissionManager';

const CameraPermissionFixScreen = () => {
  const [permissionStatus, setPermissionStatus] = useState({
    current: 'checking...',
    afterFix: null
  });

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    const permissions = PermissionManager.getAllPermissionStatuses();
    setPermissionStatus(prev => ({
      ...prev,
      current: `${permissions.camera.status} (${permissions.camera.granted ? 'granted' : 'denied'})`
    }));
  };

  const testMultipleMethods = async () => {
    try {
      Alert.alert('Testing', 'Testing multiple camera permission checking methods...');
      
      console.log('🧪 Testing camera permission with multiple methods...');
      
      // Method 1: Validate by testing
      const testResult = await PermissionManager.validateCameraPermissionByTesting();
      console.log('📸 Validation test result:', testResult);
      
      // Method 2: Sync with media service
      const syncResult = await PermissionManager.syncCameraPermissionWithMediaService();
      console.log('📸 Media service sync result:', syncResult);
      
      // Method 3: Force refresh all permissions
      const refreshResult = await PermissionManager.refreshAllPermissions();
      console.log('📸 Refresh result:', refreshResult.camera);
      
      // Update display
      setPermissionStatus(prev => ({
        ...prev,
        afterFix: `${refreshResult.camera.status} (${refreshResult.camera.granted ? 'granted' : 'denied'})`
      }));
      
      Alert.alert(
        '✅ Test Complete',
        `Permission status after testing:\n${refreshResult.camera.status} (${refreshResult.camera.granted ? 'GRANTED' : 'DENIED'})`
      );
      
    } catch (error) {
      Alert.alert('❌ Error', `Testing failed: ${error.message}`);
    }
  };

  const forceSetGranted = async () => {
    try {
      Alert.alert(
        'Force Set Permission',
        'This will manually set camera permission as granted (use only if you know it\'s actually granted).',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Force Set',
            style: 'destructive',
            onPress: async () => {
              PermissionManager.forceSetCameraPermissionGranted();
              
              // Refresh display
              const permissions = PermissionManager.getAllPermissionStatuses();
              setPermissionStatus(prev => ({
                ...prev,
                afterFix: `${permissions.camera.status} (${permissions.camera.granted ? 'granted' : 'denied'})`
              }));
              
              Alert.alert('✅ Done', 'Camera permission has been manually set as granted.');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('❌ Error', `Force set failed: ${error.message}`);
    }
  };

  const requestAgain = async () => {
    try {
      Alert.alert('Requesting', 'Requesting camera permission again...');
      
      const result = await PermissionManager.ensurePermission('camera', 'Permission Fix Test');
      
      setPermissionStatus(prev => ({
        ...prev,
        afterFix: `${result.status} (${result.granted ? 'granted' : 'denied'})`
      }));
      
      Alert.alert(
        result.granted ? '✅ Success' : '❌ Failed',
        `Camera permission: ${result.status}`
      );
      
    } catch (error) {
      Alert.alert('❌ Error', `Request failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Camera Permission Fix</Text>
      
      <View style={styles.statusSection}>
        <Text style={styles.statusTitle}>Current Status:</Text>
        <Text style={styles.statusText}>{permissionStatus.current}</Text>
        
        {permissionStatus.afterFix && (
          <>
            <Text style={styles.statusTitle}>After Fix:</Text>
            <Text style={styles.statusText}>{permissionStatus.afterFix}</Text>
          </>
        )}
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.button} onPress={checkCurrentStatus}>
          <Text style={styles.buttonText}>Check Current Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testMultipleMethods}>
          <Text style={styles.buttonText}>Test Multiple Methods</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={requestAgain}>
          <Text style={styles.buttonText}>Request Permission Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={forceSetGranted}>
          <Text style={styles.buttonText}>Force Set as Granted</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Problem:</Text>
        <Text style={styles.infoText}>• Camera permission shows as granted in media screen</Text>
        <Text style={styles.infoText}>• But shows as unavailable/denied in other screens</Text>
        <Text style={styles.infoText}>• This suggests inconsistent permission checking</Text>
        
        <Text style={styles.infoTitle}>Solutions Applied:</Text>
        <Text style={styles.infoText}>✅ Multiple fallback methods for checking camera permissions</Text>
        <Text style={styles.infoText}>✅ ImagePicker API fallback when expo-camera fails</Text>
        <Text style={styles.infoText}>✅ Permission validation by actual testing</Text>
        <Text style={styles.infoText}>✅ Sync with MediaCaptureService status</Text>
        <Text style={styles.infoText}>✅ Force override option for confirmed permissions</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2E7D32',
  },
  statusSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1976D2',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'monospace',
    color: '#666',
  },
  buttonSection: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
    color: '#1976D2',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#1565C0',
  },
});

export default CameraPermissionFixScreen;
