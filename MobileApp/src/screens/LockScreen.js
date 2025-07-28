import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import SecurityService from '../services/SecurityService';

const LockScreen = ({ onUnlock }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleBiometricUnlock = async () => {
    if (isUnlocking) return;
    
    setIsUnlocking(true);
    
    try {
      const unlocked = await SecurityService.unlockDevice();
      
      if (unlocked) {
        Alert.alert('Success', 'Device unlocked successfully');
        onUnlock();
      } else {
        Alert.alert('Failed', 'Authentication failed. Try again.');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      Alert.alert('Error', 'Failed to unlock device. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleEmergencyUnlock = async () => {
    Alert.alert(
      'Emergency Unlock',
      'This will require administrator approval. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: async () => {
            // For now, just unlock - in production this would require admin approval
            try {
              const unlocked = await SecurityService.unlockDevice();
              if (unlocked) {
                onUnlock();
              }
            } catch (error) {
              Alert.alert('Error', 'Emergency unlock failed');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={100} color="#FF3B30" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Device Locked</Text>
        <Text style={styles.subtitle}>
          This device has been locked for security. Use biometric authentication to unlock.
        </Text>

        {/* Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, isUnlocking && styles.unlockButtonDisabled]}
          onPress={handleBiometricUnlock}
          disabled={isUnlocking}
        >
          <Ionicons 
            name="finger-print" 
            size={24} 
            color="#FFFFFF" 
            style={styles.buttonIcon}
          />
          <Text style={styles.unlockButtonText}>
            {isUnlocking ? 'Unlocking...' : 'Unlock with Biometrics'}
          </Text>
        </TouchableOpacity>

        {/* Emergency Unlock */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergencyUnlock}
          disabled={isUnlocking}
        >
          <Ionicons 
            name="warning" 
            size={20} 
            color="#FF6B35" 
            style={styles.buttonIcon}
          />
          <Text style={styles.emergencyButtonText}>Emergency Unlock</Text>
        </TouchableOpacity>

        {/* Status Info */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Device locked by TrackerApp Security
          </Text>
          <Text style={styles.statusSubtext}>
            {new Date().toLocaleString()}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  unlockButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    minWidth: 250,
    justifyContent: 'center',
  },
  unlockButtonDisabled: {
    backgroundColor: '#555555',
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  emergencyButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  statusText: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 5,
  },
  statusSubtext: {
    color: '#666666',
    fontSize: 12,
  },
});

export default LockScreen;
