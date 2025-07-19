import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { loginSuccess, logout } from '../slices/authSlice';
import LocationService from '../services/LocationService';
import SocketService from '../services/SocketService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const user = JSON.parse(userData);
        dispatch(loginSuccess({ token, user }));
        
        // Initialize socket connection for authenticated user
        try {
          await SocketService.connect();
          console.log('Socket service connected automatically for authenticated user');
        } catch (error) {
          console.log('Could not connect socket service:', error.message);
        }
        
        // Check if device is activated and start location tracking
        const deviceActivated = await AsyncStorage.getItem('deviceActivated');
        if (deviceActivated === 'true') {
          try {
            await LocationService.startTracking();
            console.log('Location tracking started automatically for activated device');
          } catch (error) {
            console.log('Could not start location tracking automatically:', error.message);
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Stop location tracking
      await LocationService.stopTracking();
      
      // Disconnect socket
      await SocketService.disconnect();
      
      await AsyncStorage.multiRemove(['token', 'userData']);
      dispatch(logout());
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    isLoading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
