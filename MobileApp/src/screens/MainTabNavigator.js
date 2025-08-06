import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TrackingScreen from './TrackingScreen';
import SecurityScreen from './SecurityScreen';
import MediaScreen from './MediaScreen';
import PermissionStatusScreen from './PermissionStatusScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Tracking') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Security') {
            iconName = focused ? 'shield' : 'shield-outline';
          } else if (route.name === 'Media') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Permissions') {
            iconName = focused ? 'key' : 'key-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarLabelStyle: { fontSize: 10 },
      })}
    >
      <Tab.Screen name="Tracking" component={TrackingScreen} />
      <Tab.Screen name="Security" component={SecurityScreen} />
      <Tab.Screen name="Media" component={MediaScreen} />
      <Tab.Screen name="Permissions" component={PermissionStatusScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
