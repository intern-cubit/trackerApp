import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { setCurrentLocation, setDevices } from '../slices/trackerSlice';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { devices: trackers, currentLocation } = useSelector((state) => state.tracker);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    fetchTrackers();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required for tracking functionality'
        );
        return;
      }
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      dispatch(setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const fetchTrackers = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockTrackers = [
        {
          id: '1',
          name: 'Primary Tracker',
          status: 'active',
          battery: 85,
          lastSeen: new Date().toISOString(),
        },
      ];
      dispatch(setDevices(mockTrackers));
    } catch (error) {
      console.error('Error fetching trackers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([getCurrentLocation(), fetchTrackers()]);
    setRefreshing(false);
  };

  const navigateToScreen = (screenName) => {
    navigation.navigate(screenName);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome back, {user?.fullName || user?.name || 'User'}!
        </Text>
        <Text style={styles.subtitle}>
          Your security dashboard
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Current Status</Text>
        <View style={styles.statusRow}>
          <MaterialIcons name="location-on" size={24} color="#4CAF50" />
          <Text style={styles.statusText}>
            Location: {currentLocation ? 'Active' : 'Inactive'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <MaterialIcons name="security" size={24} color="#2196F3" />
          <Text style={styles.statusText}>
            Security: {trackers?.length > 0 ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToScreen('Tracking')}
        >
          <MaterialIcons name="my-location" size={30} color="#fff" />
          <Text style={styles.actionButtonText}>Live Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToScreen('Security')}
        >
          <MaterialIcons name="security" size={30} color="#fff" />
          <Text style={styles.actionButtonText}>Security Center</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToScreen('Media')}
        >
          <MaterialIcons name="photo-camera" size={30} color="#fff" />
          <Text style={styles.actionButtonText}>Media Capture</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToScreen('Settings')}
        >
          <MaterialIcons name="settings" size={30} color="#fff" />
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {trackers?.length > 0 && (
        <View style={styles.trackersSection}>
          <Text style={styles.sectionTitle}>Active Trackers</Text>
          {trackers.map((tracker) => (
            <View key={tracker.id} style={styles.trackerCard}>
              <View style={styles.trackerHeader}>
                <Text style={styles.trackerName}>{tracker.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: tracker.status === 'active' ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {tracker.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.trackerDetail}>
                Battery: {tracker.battery}%
              </Text>
              <Text style={styles.trackerDetail}>
                Last seen: {new Date(tracker.lastSeen).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  quickActions: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  trackersSection: {
    margin: 15,
    marginTop: 0,
  },
  trackerCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trackerDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default DashboardScreen;
