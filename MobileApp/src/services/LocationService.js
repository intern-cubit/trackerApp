import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from './SocketService';
import { API_ENDPOINTS } from '../config/api';
import { DeviceIdentityService } from './DeviceIdentityService';

const LOCATION_TASK_NAME = 'background-location-task';

class LocationService {
  constructor() {
    this.isTracking = false;
    this.currentLocation = null;
    this.watchId = null;
  }

  async initialize() {
    try {
      // Request permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted');
      }

      // Ensure device info is available for location updates
      await this.ensureDeviceInfoExists();

      // Define background task
      TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
        if (error) {
          console.error('Background location task error:', error);
          return;
        }
        if (data) {
          const { locations } = data;
          this.handleLocationUpdate(locations[0]);
        }
      });

      console.log('Location service initialized');
    } catch (error) {
      console.error('Failed to initialize location service:', error);
    }
  }

  async ensureDeviceInfoExists() {
    try {
      // Use centralized device identity service
      const deviceInfo = await DeviceIdentityService.getDeviceInfo();
      console.log('Device info ensured:', deviceInfo);
    } catch (error) {
      console.error('Error ensuring device info exists:', error);
    }
  }

  async startTracking() {
    try {
      if (this.isTracking) return;

      // Start foreground location tracking
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 10, // 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      // Start background location tracking
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 60000, // 1 minute
        distanceInterval: 50, // 50 meters
        deferredUpdatesInterval: 60000, // 1 minute
        foregroundService: {
          notificationTitle: 'TrackerApp is tracking your location',
          notificationBody: 'Location tracking is active for security purposes.',
        },
      });

      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
    }
  }

  async stopTracking() {
    try {
      if (!this.isTracking) return;

      // Stop foreground tracking
      if (this.watchId) {
        this.watchId.remove();
        this.watchId = null;
      }

      // Stop background tracking
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

      this.isTracking = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
    }
  }

  async handleLocationUpdate(location) {
    try {
      this.currentLocation = location;
      
      // Save to local history
      await this.saveLocationToHistory(location);
      
      // Send to backend
      await this.sendLocationToBackend(location);
      
      // Emit via socket
      SocketService.emit('location-update', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      });

      console.log('Location updated:', location.coords);
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  async sendLocationToBackend(location) {
    try {
      // Use centralized device identity service to get device code
      const deviceInfo = await DeviceIdentityService.getDeviceInfo();
      const deviceCode = deviceInfo.deviceCode;

      if (!deviceCode) {
        console.log('Failed to get device code, skipping backend location update');
        return;
      }

      console.log('Using device code for location update:', deviceCode);

      // Format date and time
      const now = new Date(location.timestamp);
      const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const time = now.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS

      // Send location update to backend
      const response = await fetch(API_ENDPOINTS.LOCATION_UPDATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceName: deviceCode, // Use device code directly (no hyphens to remove)
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          date: date,
          time: time,
          inputVoltage: 12.0, // Default values for mobile
          batteryVoltage: 4.0,
          alert: false,
        }),
      });

      if (response.ok) {
        console.log('Location sent to backend successfully');
      } else {
        console.error('Failed to send location to backend:', response.status);
        const errorText = await response.text();
        console.error('Backend response:', errorText);
      }
    } catch (error) {
      console.error('Error sending location to backend:', error);
    }
  }

  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  async getLocationHistory() {
    try {
      const history = await AsyncStorage.getItem('locationHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get location history:', error);
      return [];
    }
  }

  async saveLocationToHistory(location) {
    try {
      const history = await this.getLocationHistory();
      history.push({
        ...location,
        timestamp: Date.now(),
      });

      // Keep only last 1000 locations
      if (history.length > 1000) {
        history.splice(0, history.length - 1000);
      }

      await AsyncStorage.setItem('locationHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save location to history:', error);
    }
  }

  isLocationTrackingEnabled() {
    return this.isTracking;
  }

  getLastKnownLocation() {
    return this.currentLocation;
  }
}

export default new LocationService();
