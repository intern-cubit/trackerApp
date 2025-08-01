// Enhanced Security Testing Script
// This script helps test all the enhanced security features

import EnhancedSecurityService from './src/services/EnhancedSecurityService.js';
import PerformanceBoosterService from './src/services/PerformanceBoosterService.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SecurityTester {
  constructor() {
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Enhanced Security Feature Tests...\n');
    
    try {
      // Test 1: Service Initialization
      await this.testServiceInitialization();
      
      // Test 2: Auto-Lock Features
      await this.testAutoLockFeatures();
      
      // Test 3: Movement Detection
      await this.testMovementDetection();
      
      // Test 4: Performance Booster
      await this.testPerformanceBooster();
      
      // Test 5: Security Settings
      await this.testSecuritySettings();
      
      // Test 6: Remote Commands
      await this.testRemoteCommands();
      
      console.log('\n📊 Test Results Summary:');
      console.log('========================');
      this.testResults.forEach((result, index) => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} Test ${index + 1}: ${result.name} - ${result.message}`);
      });
      
      const passedTests = this.testResults.filter(r => r.passed).length;
      const totalTests = this.testResults.length;
      console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
      
      return { passedTests, totalTests, results: this.testResults };
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return { error: error.message, results: this.testResults };
    }
  }

  async testServiceInitialization() {
    try {
      console.log('🔧 Testing Service Initialization...');
      
      // Test Enhanced Security Service
      await EnhancedSecurityService.initialize();
      const isInitialized = EnhancedSecurityService.isInitialized;
      
      this.addTestResult('Enhanced Security Service Initialization', isInitialized, 
        isInitialized ? 'Service initialized successfully' : 'Service failed to initialize');
      
      // Test Performance Booster Service
      const boosterMetrics = await PerformanceBoosterService.getPerformanceMetrics();
      const boosterWorking = boosterMetrics !== null;
      
      this.addTestResult('Performance Booster Service', boosterWorking,
        boosterWorking ? 'Booster service is working' : 'Booster service failed');
      
    } catch (error) {
      this.addTestResult('Service Initialization', false, `Error: ${error.message}`);
    }
  }

  async testAutoLockFeatures() {
    try {
      console.log('🔒 Testing Auto-Lock Features...');
      
      // Test failed attempt recording
      const initialAttempts = EnhancedSecurityService.getFailedAttempts();
      await EnhancedSecurityService.recordFailedAttempt('test');
      const newAttempts = EnhancedSecurityService.getFailedAttempts();
      
      const attemptRecorded = newAttempts > initialAttempts;
      this.addTestResult('Failed Attempt Recording', attemptRecorded,
        attemptRecorded ? 'Failed attempts are being tracked' : 'Failed attempt tracking failed');
      
      // Test auto-lock settings
      const settings = EnhancedSecurityService.getSecuritySettings();
      const hasAutoLock = settings.autoLockEnabled !== undefined;
      
      this.addTestResult('Auto-Lock Settings', hasAutoLock,
        hasAutoLock ? 'Auto-lock settings available' : 'Auto-lock settings missing');
      
      // Reset attempts for clean state
      if (attemptRecorded) {
        await EnhancedSecurityService.updateSettings({ failedAttempts: 0 });
      }
      
    } catch (error) {
      this.addTestResult('Auto-Lock Features', false, `Error: ${error.message}`);
    }
  }

  async testMovementDetection() {
    try {
      console.log('📱 Testing Movement Detection...');
      
      // Test movement detection setup
      const settings = EnhancedSecurityService.getSecuritySettings();
      const hasMovementSettings = settings.movementLockEnabled !== undefined && 
                                  settings.movementThreshold !== undefined;
      
      this.addTestResult('Movement Detection Settings', hasMovementSettings,
        hasMovementSettings ? 'Movement detection settings available' : 'Movement settings missing');
      
      // Test settings update
      await EnhancedSecurityService.updateSettings({ 
        movementLockEnabled: true, 
        movementThreshold: 2.0 
      });
      
      const updatedSettings = EnhancedSecurityService.getSecuritySettings();
      const settingsUpdated = updatedSettings.movementLockEnabled === true && 
                             updatedSettings.movementThreshold === 2.0;
      
      this.addTestResult('Movement Settings Update', settingsUpdated,
        settingsUpdated ? 'Movement settings updated successfully' : 'Settings update failed');
      
    } catch (error) {
      this.addTestResult('Movement Detection', false, `Error: ${error.message}`);
    }
  }

  async testPerformanceBooster() {
    try {
      console.log('⚡ Testing Performance Booster...');
      
      // Test performance boost execution
      const boostStats = await PerformanceBoosterService.performSystemBoost();
      const boostWorked = boostStats && boostStats.duration > 0;
      
      this.addTestResult('Performance Boost Execution', boostWorked,
        boostWorked ? `Boost completed in ${boostStats.duration}ms` : 'Performance boost failed');
      
      // Test storage info retrieval
      const storageInfo = await PerformanceBoosterService.getStorageInfo();
      const storageInfoAvailable = storageInfo && typeof storageInfo === 'object';
      
      this.addTestResult('Storage Info Retrieval', storageInfoAvailable,
        storageInfoAvailable ? 'Storage information retrieved' : 'Storage info retrieval failed');
      
      // Test boost history
      const history = await PerformanceBoosterService.getBoostHistory();
      const historyAvailable = Array.isArray(history);
      
      this.addTestResult('Boost History Tracking', historyAvailable,
        historyAvailable ? `Found ${history.length} boost records` : 'History tracking failed');
      
    } catch (error) {
      this.addTestResult('Performance Booster', false, `Error: ${error.message}`);
    }
  }

  async testSecuritySettings() {
    try {
      console.log('⚙️ Testing Security Settings...');
      
      // Test settings persistence
      const testSettings = {
        autoLockEnabled: true,
        maxFailedAttempts: 5,
        movementLockEnabled: false,
        usbLockEnabled: true,
        performanceBoostEnabled: true
      };
      
      await EnhancedSecurityService.updateSettings(testSettings);
      const retrievedSettings = EnhancedSecurityService.getSecuritySettings();
      
      const settingsPersisted = Object.keys(testSettings).every(key => 
        retrievedSettings[key] === testSettings[key]
      );
      
      this.addTestResult('Settings Persistence', settingsPersisted,
        settingsPersisted ? 'Settings saved and retrieved correctly' : 'Settings persistence failed');
      
      // Test security events logging
      const eventLogged = await this.testSecurityEventLogging();
      this.addTestResult('Security Event Logging', eventLogged,
        eventLogged ? 'Security events are being logged' : 'Event logging failed');
      
    } catch (error) {
      this.addTestResult('Security Settings', false, `Error: ${error.message}`);
    }
  }

  async testSecurityEventLogging() {
    try {
      // Test logging a security event
      await EnhancedSecurityService.logSecurityEvent({
        type: 'test_event',
        details: { test: true },
        timestamp: Date.now()
      });
      
      // Check if event was stored
      const settings = await AsyncStorage.getItem('enhancedSecuritySettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.securityEvents && parsed.securityEvents.length > 0;
      }
      return false;
    } catch (error) {
      console.warn('Security event logging test failed:', error.message);
      return false;
    }
  }

  async testRemoteCommands() {
    try {
      console.log('📡 Testing Remote Commands...');
      
      // Test lock/unlock functionality
      const initialLockState = EnhancedSecurityService.isLocked();
      
      // Test lock
      EnhancedSecurityService.isDeviceLocked = true;
      const deviceLocked = EnhancedSecurityService.isLocked();
      
      // Test unlock
      await EnhancedSecurityService.unlockDevice('test');
      const deviceUnlocked = !EnhancedSecurityService.isLocked();
      
      const lockUnlockWorking = deviceLocked && deviceUnlocked;
      this.addTestResult('Remote Lock/Unlock', lockUnlockWorking,
        lockUnlockWorking ? 'Lock and unlock functions working' : 'Lock/unlock failed');
      
      // Test settings update capability
      const settingsUpdateWorking = typeof EnhancedSecurityService.updateSettings === 'function';
      this.addTestResult('Remote Settings Update', settingsUpdateWorking,
        settingsUpdateWorking ? 'Settings update function available' : 'Settings update missing');
      
    } catch (error) {
      this.addTestResult('Remote Commands', false, `Error: ${error.message}`);
    }
  }

  addTestResult(name, passed, message) {
    this.testResults.push({ name, passed, message });
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}: ${message}`);
  }

  // Quick test method for individual features
  async quickTest(featureName) {
    console.log(`🔍 Quick testing: ${featureName}`);
    
    switch (featureName.toLowerCase()) {
      case 'autolock':
        await this.testAutoLockFeatures();
        break;
      case 'movement':
        await this.testMovementDetection();
        break;
      case 'booster':
        await this.testPerformanceBooster();
        break;
      case 'settings':
        await this.testSecuritySettings();
        break;
      default:
        console.log('❓ Unknown feature. Available: autolock, movement, booster, settings');
    }
  }
}

// Export for use in the app
export default SecurityTester;

// Usage example:
/*
import SecurityTester from './test-security-features.js';

const tester = new SecurityTester();

// Run all tests
tester.runAllTests().then(results => {
  console.log('Test completed:', results);
});

// Or test individual features
tester.quickTest('autolock');
*/
