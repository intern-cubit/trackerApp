import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    try {
      // Check if running in Expo Go
      if (__DEV__ && !Device.isDevice) {
        console.log('NotificationService: Running in simulator/Expo Go - limited functionality');
        return;
      }

      // Register for push notifications with error handling for Expo Go
      try {
        await this.registerForPushNotificationsAsync();
      } catch (error) {
        console.log('NotificationService: Push notifications not available in Expo Go');
        return;
      }
      
      // Listen for incoming notifications
      this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        this.handleNotificationReceived(notification);
      });

      // Listen for notification interactions
      this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        this.handleNotificationResponse(response);
      });

      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.log('NotificationService: Limited functionality in Expo Go environment');
    }
  }

  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    this.expoPushToken = token;
    return token;
  }

  async sendLocalNotification(title, body, data = {}) {
    try {
      const notification = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
      
      console.log('Local notification sent:', notification);
      return notification;
    } catch (error) {
      console.error('Failed to send local notification:', error);
      throw error;
    }
  }

  async sendSecurityAlert(alertType, message, location = null) {
    const title = this.getAlertTitle(alertType);
    const body = message || this.getDefaultAlertMessage(alertType);
    
    const data = {
      type: 'security_alert',
      alertType,
      timestamp: new Date().toISOString(),
      location,
    };

    return this.sendLocalNotification(title, body, data);
  }

  async sendGeofenceAlert(isEntering, geofenceName, location) {
    const action = isEntering ? 'entered' : 'left';
    const title = 'Geofence Alert';
    const body = `Device has ${action} ${geofenceName}`;
    
    const data = {
      type: 'geofence_alert',
      action,
      geofenceName,
      location,
      timestamp: new Date().toISOString(),
    };

    return this.sendLocalNotification(title, body, data);
  }

  async sendLocationAlert(message, location) {
    const title = 'Location Alert';
    const data = {
      type: 'location_alert',
      location,
      timestamp: new Date().toISOString(),
    };

    return this.sendLocalNotification(title, message, data);
  }

  async sendBatteryAlert(batteryLevel) {
    const title = 'Low Battery Warning';
    const body = `Device battery is at ${batteryLevel}%`;
    
    const data = {
      type: 'battery_alert',
      batteryLevel,
      timestamp: new Date().toISOString(),
    };

    return this.sendLocalNotification(title, body, data);
  }

  getAlertTitle(alertType) {
    const titles = {
      sos: '🚨 SOS Alert',
      intrusion: '🔒 Security Breach',
      tamper: '⚠️ Device Tampered',
      unauthorized_access: '🚫 Unauthorized Access',
      panic: '🆘 Panic Button',
      default: '⚠️ Security Alert',
    };
    
    return titles[alertType] || titles.default;
  }

  getDefaultAlertMessage(alertType) {
    const messages = {
      sos: 'Emergency SOS has been triggered!',
      intrusion: 'Unauthorized device access detected!',
      tamper: 'Device tampering attempt detected!',
      unauthorized_access: 'Unauthorized access attempt!',
      panic: 'Panic button has been activated!',
      default: 'Security event detected!',
    };
    
    return messages[alertType] || messages.default;
  }

  handleNotificationReceived(notification) {
    // Handle incoming notification while app is in foreground
    const { data } = notification.request.content;
    
    if (data?.type === 'security_alert') {
      // Handle security alerts
      console.log('Security alert received:', data);
    } else if (data?.type === 'geofence_alert') {
      // Handle geofence alerts
      console.log('Geofence alert received:', data);
    }
  }

  handleNotificationResponse(response) {
    // Handle user interaction with notification
    const { data } = response.notification.request.content;
    
    if (data?.type === 'security_alert') {
      // Navigate to security screen or take appropriate action
      console.log('User tapped security alert:', data);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
    }
  }

  async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new NotificationService();
