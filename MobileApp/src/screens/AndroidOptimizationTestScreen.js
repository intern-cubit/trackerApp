import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MediaCaptureService from '../services/MediaCaptureService';
import PermissionManager from '../services/PermissionManager';

const AndroidOptimizationTestScreen = () => {
  const [testResults, setTestResults] = useState({
    audioTest: 'Not tested',
    cameraPermissionTest: 'Not tested',
    permissionRefresh: 'Not tested'
  });

  const testAndroidAudioAlarm = async () => {
    try {
      console.log('🧪 Testing Android-only audio alarm...');
      
      Alert.alert(
        'Testing Audio Alarm', 
        'Testing Android-optimized audio alarm (should work without iOS errors)',
        [{ text: 'OK' }]
      );
      
      const success = await MediaCaptureService.startAudioAlarm(3); // 3 second test
      
      if (success) {
        setTestResults(prev => ({
          ...prev,
          audioTest: '✅ SUCCESS - Audio alarm working'
        }));
        Alert.alert('✅ Success', 'Audio alarm started successfully for Android!');
      } else {
        setTestResults(prev => ({
          ...prev,
          audioTest: '❌ FAILED - Audio alarm failed'
        }));
        Alert.alert('❌ Failed', 'Audio alarm failed to start');
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        audioTest: `❌ ERROR - ${error.message}`
      }));
      Alert.alert('❌ Error', `Audio test failed: ${error.message}`);
    }
  };

  const testCameraPermission = async () => {
    try {
      console.log('🧪 Testing camera permission fix...');
      
      const result = await PermissionManager.ensurePermission('camera', 'Test Camera');
      
      if (result.granted) {
        setTestResults(prev => ({
          ...prev,
          cameraPermissionTest: '✅ SUCCESS - Camera permission granted'
        }));
        Alert.alert('✅ Success', 'Camera permission is working correctly!');
      } else {
        setTestResults(prev => ({
          ...prev,
          cameraPermissionTest: `❌ FAILED - Status: ${result.status}`
        }));
        Alert.alert('❌ Failed', `Camera permission failed: ${result.status}`);
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        cameraPermissionTest: `❌ ERROR - ${error.message}`
      }));
      Alert.alert('❌ Error', `Camera permission test failed: ${error.message}`);
    }
  };

  const testPermissionRefresh = async () => {
    try {
      console.log('🧪 Testing permission refresh...');
      
      const refreshedPermissions = await PermissionManager.refreshAllPermissions();
      
      const cameraStatus = refreshedPermissions.camera.status;
      const cameraGranted = refreshedPermissions.camera.granted;
      
      setTestResults(prev => ({
        ...prev,
        permissionRefresh: `✅ REFRESHED - Camera: ${cameraStatus} (${cameraGranted ? 'granted' : 'denied'})`
      }));
      
      Alert.alert(
        '✅ Permissions Refreshed', 
        `Camera permission status: ${cameraStatus}\nGranted: ${cameraGranted ? 'Yes' : 'No'}`
      );
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        permissionRefresh: `❌ ERROR - ${error.message}`
      }));
      Alert.alert('❌ Error', `Permission refresh failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤖 Android Optimization Tests</Text>
      
      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Audio Alarm Fix</Text>
        <Text style={styles.testResult}>{testResults.audioTest}</Text>
        <TouchableOpacity style={styles.testButton} onPress={testAndroidAudioAlarm}>
          <Text style={styles.buttonText}>Test Audio Alarm (Android Only)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Camera Permission Fix</Text>
        <Text style={styles.testResult}>{testResults.cameraPermissionTest}</Text>
        <TouchableOpacity style={styles.testButton} onPress={testCameraPermission}>
          <Text style={styles.buttonText}>Test Camera Permission</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Permission Refresh</Text>
        <Text style={styles.testResult}>{testResults.permissionRefresh}</Text>
        <TouchableOpacity style={styles.testButton} onPress={testPermissionRefresh}>
          <Text style={styles.buttonText}>Refresh All Permissions</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Fixes Applied:</Text>
        <Text style={styles.infoText}>✅ Removed iOS audio configuration that was causing errors</Text>
        <Text style={styles.infoText}>✅ Added Android-only audio mode configuration</Text>
        <Text style={styles.infoText}>✅ Enhanced camera permission error handling</Text>
        <Text style={styles.infoText}>✅ Added permission refresh functionality</Text>
        <Text style={styles.infoText}>✅ Optimized security features for Android-only deployment</Text>
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
  testSection: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  testResult: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2E7D32',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#388E3C',
  },
});

export default AndroidOptimizationTestScreen;
