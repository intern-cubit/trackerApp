import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DeviceIdentityService {
  static async getOrCreateDeviceCode() {
    try {
      // First, try to get existing device code from storage
      const existingCode = await AsyncStorage.getItem('deviceCode');
      if (existingCode) {
        // Check if the existing code has hyphens (old format) and clear if so
        if (existingCode.includes('-')) {
          console.log('Found old device code with hyphens, clearing and regenerating:', existingCode);
          await AsyncStorage.multiRemove(['deviceCode', 'deviceInfo']);
          // Continue to generate new code below
        } else {
          console.log('Found existing device code:', existingCode);
          return existingCode;
        }
      }

      // If no existing code or old format found, generate a new one based on consistent device identifiers
      const deviceCode = await this.generateConsistentDeviceCode();
      
      // Store the generated code
      await AsyncStorage.setItem('deviceCode', deviceCode);
      console.log('Generated new device code:', deviceCode);
      
      return deviceCode;
    } catch (error) {
      console.error('Error getting or creating device code:', error);
      // Fallback to timestamp-based code if all else fails
      const fallbackCode = `000000000000${Date.now().toString().slice(-8)}`.slice(-12);
      await AsyncStorage.setItem('deviceCode', fallbackCode);
      return fallbackCode;
    }
  }

  static async generateConsistentDeviceCode() {
    try {
      // Use multiple device identifiers for consistency
      const identifiers = [
        Device.osInternalBuildId,
        Device.osBuildId,
        Device.modelId,
        Device.brand,
        Device.modelName,
        Platform.OS
      ].filter(Boolean); // Remove null/undefined values
      
      // Create a consistent device fingerprint
      const deviceFingerprint = identifiers.join('|') || `mobile_${Platform.OS}`;
      
      // Generate hash from the fingerprint
      const deviceCode = this.generateHashCode(deviceFingerprint);
      
      return deviceCode;
    } catch (error) {
      console.error('Error generating consistent device code:', error);
      // Fallback to platform-based code
      return this.generateHashCode(`mobile_${Platform.OS}_fallback`);
    }
  }

  static generateHashCode(input) {
    // Generate a simple hash-like code from input string
    let hash = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Convert to positive number and create 12-digit code (no hyphens)
    const positiveHash = Math.abs(hash);
    const part1 = (positiveHash % 10000).toString().padStart(4, '0');
    const part2 = ((positiveHash >> 4) % 10000).toString().padStart(4, '0');
    const part3 = ((positiveHash >> 8) % 10000).toString().padStart(4, '0');
    
    return `${part1}${part2}${part3}`;
  }

  static async getDeviceInfo() {
    try {
      // Check for and clear old device info with hyphenated codes
      const existingDeviceInfo = await AsyncStorage.getItem('deviceInfo');
      if (existingDeviceInfo) {
        try {
          const parsedInfo = JSON.parse(existingDeviceInfo);
          if (parsedInfo.deviceCode && parsedInfo.deviceCode.includes('-')) {
            console.log('Found old device info with hyphenated code, clearing:', parsedInfo.deviceCode);
            await AsyncStorage.multiRemove(['deviceCode', 'deviceInfo']);
          }
        } catch (parseError) {
          console.log('Error parsing existing device info, clearing storage');
          await AsyncStorage.multiRemove(['deviceCode', 'deviceInfo']);
        }
      }

      const deviceCode = await this.getOrCreateDeviceCode();
      const deviceName = Device.deviceName || `${Device.brand} ${Device.modelName}`;
      const deviceId = Device.osBuildId || Device.osInternalBuildId || `mobile_${Date.now()}`;
      
      const deviceInfo = {
        deviceId: deviceId.substring(0, 15).padEnd(15, '0'), // Ensure 15 characters
        deviceName: deviceName.substring(0, 50), // Limit device name length
        deviceType: 'mobile',
        platform: Platform.OS,
        appVersion: '1.0.0',
        deviceCode: deviceCode
      };

      // Store complete device info
      await AsyncStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
      
      console.log('Device info exists with code:', deviceCode);
      return deviceInfo;
    } catch (error) {
      console.error('Error getting device info:', error);
      // Return fallback device info
      const fallbackCode = await this.getOrCreateDeviceCode();
      const fallbackInfo = {
        deviceId: `mobile${Date.now()}`.substring(0, 15).padEnd(15, '0'),
        deviceName: 'Mobile Device',
        deviceType: 'mobile',
        platform: Platform.OS,
        appVersion: '1.0.0',
        deviceCode: fallbackCode
      };
      
      await AsyncStorage.setItem('deviceInfo', JSON.stringify(fallbackInfo));
      return fallbackInfo;
    }
  }
}
