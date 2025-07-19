import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentLocation, setTracking } from '../slices/trackerSlice';
import LocationService from '../services/LocationService';

const TrackingScreen = () => {
  const dispatch = useDispatch();
  const { isTracking, currentLocation } = useSelector(state => state.tracker);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    requestPermissions();
    initializeLocationService();
  }, []);

  const initializeLocationService = async () => {
    try {
      await LocationService.initialize();
    } catch (error) {
      console.error('Failed to initialize LocationService:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        setLocationPermission(backgroundStatus.status === 'granted');
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  };

  const startTracking = async () => {
    if (!locationPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is required for tracking.',
        [{ text: 'OK', onPress: requestPermissions }]
      );
      return;
    }

    try {
      dispatch(setTracking(true));
      
      // Start LocationService which will handle both local state and backend updates
      await LocationService.startTracking();
      
      // Get current location for immediate display
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      dispatch(setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      }));

      Alert.alert('Success', 'Tracking started successfully! Location updates will be sent to the server.');
    } catch (error) {
      console.error('Tracking error:', error);
      Alert.alert('Error', 'Failed to start tracking');
      dispatch(setTracking(false));
    }
  };

  const stopTracking = async () => {
    try {
      dispatch(setTracking(false));
      await LocationService.stopTracking();
      Alert.alert('Success', 'Tracking stopped');
    } catch (error) {
      console.error('Error stopping tracking:', error);
      Alert.alert('Success', 'Tracking stopped');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GPS Tracking</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[
          styles.statusText,
          { color: isTracking ? '#4CAF50' : '#FF5722' }
        ]}>
          {isTracking ? 'Active' : 'Inactive'}
        </Text>
      </View>

      {currentLocation && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationTitle}>Current Location:</Text>
          <Text style={styles.locationText}>
            Lat: {currentLocation.latitude?.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Lng: {currentLocation.longitude?.toFixed(6)}
          </Text>
          {currentLocation.timestamp && (
            <Text style={styles.locationText}>
              Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isTracking ? '#FF5722' : '#4CAF50' }
        ]}
        onPress={isTracking ? stopTracking : startTracking}
      >
        <Text style={styles.buttonText}>
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Text>
      </TouchableOpacity>

      {!locationPermission && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Location permission is required for tracking features
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermissions}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  statusLabel: {
    fontSize: 18,
    color: '#666',
    marginRight: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default TrackingScreen;
