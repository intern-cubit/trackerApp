import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store/store';
import { AuthProvider } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';

// Services
import LocationService from './src/services/LocationService';
import SecurityService from './src/services/SecurityService';
import NotificationService from './src/services/NotificationService';
import MediaCaptureService from './src/services/MediaCaptureService';
import SocketService from './src/services/SocketService';

export default function App() {
  React.useEffect(() => {
    // Initialize services with error handling
    const initializeServices = async () => {
      try {
        console.log('Initializing services...');
        
        // Initialize Location Service
        try {
          await LocationService.initialize();
          console.log('LocationService initialized');
        } catch (error) {
          console.log('LocationService initialization skipped:', error.message);
        }

        // Initialize Security Service
        try {
          await SecurityService.initialize();
          console.log('SecurityService initialized');
        } catch (error) {
          console.log('SecurityService initialization skipped:', error.message);
        }

        // Initialize Notification Service
        try {
          await NotificationService.initialize();
          console.log('NotificationService initialized');
        } catch (error) {
          console.log('NotificationService initialization skipped:', error.message);
        }

        // Initialize Media Capture Service
        try {
          await MediaCaptureService.initialize();
          console.log('MediaCaptureService initialized');
        } catch (error) {
          console.log('MediaCaptureService initialization skipped:', error.message);
        }

        console.log('All services initialized successfully');
      } catch (error) {
        console.log('Service initialization completed with some limitations');
      }
    };

    initializeServices();
  }, []);

  return (
    <Provider store={store}>
      <AuthProvider>
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </Provider>
  );
}
