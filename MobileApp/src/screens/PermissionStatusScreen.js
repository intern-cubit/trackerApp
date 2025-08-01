import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PermissionManager from '../services/PermissionManager';

const PermissionStatusScreen = ({ navigation }) => {
  const [permissions, setPermissions] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPermissionStatus();
  }, []);

  const loadPermissionStatus = async () => {
    try {
      await PermissionManager.checkAllPermissions();
      const currentPermissions = PermissionManager.getAllPermissionStatuses();
      setPermissions(currentPermissions);
    } catch (error) {
      console.error('Error loading permission status:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPermissionStatus();
    setRefreshing(false);
  };

  const requestPermission = async (permissionType, featureName) => {
    try {
      const result = await PermissionManager.ensurePermission(permissionType, featureName);
      
      if (result.granted) {
        Alert.alert('✅ Permission Granted', `${featureName} permission has been granted!`);
      } else if (result.status === 'settings_opened') {
        Alert.alert('Settings Opened', 'Please grant the permission in Settings and return to the app.');
      } else {
        Alert.alert('❌ Permission Denied', `${featureName} permission was not granted.`);
      }
      
      // Refresh permission status
      await loadPermissionStatus();
      
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request permission');
    }
  };

  const openSettings = () => {
    Alert.alert(
      'Open Settings',
      'You can manage all app permissions in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  };

  const getPermissionIcon = (permissionType, granted) => {
    const icons = {
      location: granted ? 'location' : 'location-outline',
      camera: granted ? 'camera' : 'camera-outline',
      mediaLibrary: granted ? 'folder' : 'folder-outline',
      notifications: granted ? 'notifications' : 'notifications-outline',
      biometric: granted ? 'finger-print' : 'finger-print-outline'
    };
    
    return icons[permissionType] || 'help-outline';
  };

  const getPermissionColor = (status) => {
    switch (status) {
      case 'granted': return '#4CAF50';
      case 'denied': return '#F44336';
      case 'undetermined': return '#FF9800';
      case 'unavailable': return '#9E9E9E';
      default: return '#757575';
    }
  };

  const getPermissionStatusText = (status) => {
    switch (status) {
      case 'granted': return 'Granted';
      case 'denied': return 'Denied';
      case 'undetermined': return 'Not Requested';
      case 'unavailable': return 'Unavailable';
      default: return 'Unknown';
    }
  };

  const getFeatureName = (permissionType) => {
    const names = {
      location: 'Location Services',
      camera: 'Camera Access',
      mediaLibrary: 'Media Library',
      notifications: 'Notifications',
      biometric: 'Biometric Authentication'
    };
    
    return names[permissionType] || permissionType;
  };

  const renderPermissionItem = (permissionType, permission) => {
    const isGranted = permission.granted;
    const statusColor = getPermissionColor(permission.status);
    const icon = getPermissionIcon(permissionType, isGranted);
    const featureName = getFeatureName(permissionType);
    
    return (
      <View key={permissionType} style={styles.permissionItem}>
        <View style={styles.permissionHeader}>
          <View style={styles.permissionInfo}>
            <Ionicons 
              name={icon} 
              size={24} 
              color={statusColor}
              style={styles.permissionIcon}
            />
            <View style={styles.permissionDetails}>
              <Text style={styles.permissionName}>{featureName}</Text>
              <Text style={styles.permissionDescription}>{permission.description}</Text>
            </View>
          </View>
          <View style={styles.permissionStatus}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getPermissionStatusText(permission.status)}
            </Text>
            {permission.required && (
              <Text style={styles.requiredText}>Required</Text>
            )}
          </View>
        </View>
        
        {!isGranted && permission.status !== 'unavailable' && (
          <TouchableOpacity
            style={[styles.requestButton, { borderColor: statusColor }]}
            onPress={() => requestPermission(permissionType, featureName)}
          >
            <Text style={[styles.requestButtonText, { color: statusColor }]}>
              Request Permission
            </Text>
          </TouchableOpacity>
        )}
        
        {permission.status === 'unavailable' && (
          <View style={styles.unavailableContainer}>
            <Text style={styles.unavailableText}>
              This feature is not available on your device
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getOverallStatus = () => {
    const total = Object.keys(permissions).length;
    const granted = Object.values(permissions).filter(p => p.granted).length;
    return { total, granted };
  };

  const { total, granted } = getOverallStatus();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>App Permissions</Text>
        <Text style={styles.subtitle}>
          Manage permissions for security features
        </Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Permission Status</Text>
          <Text style={styles.summaryText}>
            {granted}/{total} permissions granted
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${total > 0 ? (granted / total) * 100 : 0}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      <View style={styles.permissionsList}>
        {Object.entries(permissions).map(([type, permission]) =>
          renderPermissionItem(type, permission)
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
          <Ionicons name="settings" size={20} color="#fff" />
          <Text style={styles.settingsButtonText}>Open Device Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#2196F3" />
          <Text style={styles.refreshButtonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Why These Permissions?</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.bold}>Location:</Text> For tracking, emergency alerts, and security event logging{'\n'}
          • <Text style={styles.bold}>Camera:</Text> For security photos/videos and evidence capture{'\n'}
          • <Text style={styles.bold}>Media Library:</Text> For saving captured media files{'\n'}
          • <Text style={styles.bold}>Notifications:</Text> For security alerts and warnings{'\n'}
          • <Text style={styles.bold}>Biometric:</Text> For secure authentication and app protection
        </Text>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  permissionsList: {
    padding: 15,
  },
  permissionItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  permissionInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  permissionIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  permissionDetails: {
    flex: 1,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  permissionStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  requiredText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  requestButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unavailableContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  unavailableText: {
    fontSize: 12,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  actions: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  settingsButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginLeft: 10,
  },
  refreshButtonText: {
    color: '#2196F3',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
});

export default PermissionStatusScreen;
