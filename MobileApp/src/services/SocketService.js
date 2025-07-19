import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import { API_BASE_URL } from '../config/api';

const SOCKET_BACKGROUND_TASK = 'socket-background-task';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
    this.appState = AppState.currentState;
    this.heartbeatInterval = null;
    this.setupAppStateListener();
    this.setupBackgroundTask();
  }

  setupAppStateListener() {
    AppState.addEventListener('change', (nextAppState) => {
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App came to foreground - ensuring socket connection');
        this.ensureConnection();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('App went to background - maintaining socket connection');
        this.startHeartbeat();
      }
      this.appState = nextAppState;
    });
  }

  setupBackgroundTask() {
    // Define background task for socket connection maintenance
    TaskManager.defineTask(SOCKET_BACKGROUND_TASK, async ({ data, error }) => {
      if (error) {
        console.error('Socket background task error:', error);
        return;
      }
      
      try {
        // Ensure socket connection is maintained
        await this.ensureConnection();
        
        // Send heartbeat
        if (this.socket && this.isConnected) {
          this.socket.emit('ping');
        }
      } catch (error) {
        console.error('Background task socket maintenance error:', error);
      }
    });
  }

  async ensureConnection() {
    if (!this.isConnected && this.socket) {
      // Try to reconnect if disconnected
      await this.connect();
    } else if (!this.socket) {
      // Initialize connection if socket doesn't exist
      await this.connect();
    }
  }

  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Send heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.isConnected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem('token');
      let deviceId = await AsyncStorage.getItem('deviceId');
      
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found');
      }

      // If no device ID, try to get it from the backend
      if (!deviceId) {
        console.log('No device ID found locally, attempting to fetch from backend');
        deviceId = await this.fetchDeviceIdFromBackend(token);
      }

      console.log('Connecting socket with:', {
        hasToken: !!token,
        hasDeviceId: !!deviceId,
        socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL
      });

      // Disconnect existing socket if any
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(process.env.EXPO_PUBLIC_SOCKET_URL || API_BASE_URL, {
        auth: {
          token,
          deviceId,
          type: 'mobile'
        },
        transports: ['websocket'],
        timeout: 10000, // Increase timeout
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventListeners();
      console.log('Socket connection initiated with auth data');
      
      // Start heartbeat for background maintenance
      this.startHeartbeat();
      
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  }

  async fetchDeviceIdFromBackend(token) {
    try {
      const deviceCode = await AsyncStorage.getItem('deviceCode');
      if (!deviceCode) {
        console.warn('No device code available to fetch device ID');
        return null;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || API_BASE_URL}/api/device/by-code/${deviceCode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.device && data.device._id) {
          await AsyncStorage.setItem('deviceId', data.device._id);
          console.log('Device ID fetched and stored:', data.device._id);
          return data.device._id;
        }
      } else {
        console.warn('Failed to fetch device ID from backend:', response.status);
      }
    } catch (error) {
      console.error('Error fetching device ID from backend:', error);
    }
    return null;
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Socket connected successfully! ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket disconnected. Reason:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message || error);
      console.error('Error details:', {
        description: error.description,
        context: error.context,
        type: error.type
      });
      this.handleReconnect();
    });

    this.socket.on('authenticated', (data) => {
      console.log('🔐 Socket authenticated successfully:', data);
    });

    this.socket.on('error', (error) => {
      console.error('⚠️ Socket error:', error);
    });

    // Pong response for heartbeat
    this.socket.on('pong', (data) => {
      console.log('💓 Heartbeat pong received:', data);
    });

    // Device-specific events
    this.socket.on('device-command', (command) => {
      this.handleDeviceCommand(command);
    });

    this.socket.on('configuration-update', (config) => {
      this.handleConfigurationUpdate(config);
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, delay);
  }

  handleDeviceCommand(command) {
    const { type, data } = command;
    
    console.log('Received device command:', type, data);
    
    // Emit to registered listeners
    if (this.eventListeners.has(type)) {
      const listeners = this.eventListeners.get(type);
      listeners.forEach(listener => listener(data));
    }

    // Handle built-in commands
    switch (type) {
      case 'ping':
        this.emit('pong', { timestamp: Date.now() });
        break;
      case 'status-request':
        this.sendDeviceStatus();
        break;
      default:
        // Custom command handlers will be registered via 'on' method
        break;
    }
  }

  handleConfigurationUpdate(config) {
    console.log('Configuration update received:', config);
    
    // Store configuration locally
    AsyncStorage.setItem('deviceConfig', JSON.stringify(config))
      .then(() => {
        // Emit to registered listeners
        if (this.eventListeners.has('configuration-update')) {
          const listeners = this.eventListeners.get('configuration-update');
          listeners.forEach(listener => listener(config));
        }
      })
      .catch(error => {
        console.error('Failed to save configuration:', error);
      });
  }

  async sendDeviceStatus() {
    try {
      const deviceId = await AsyncStorage.getItem('deviceId');
      const battery = await this.getBatteryLevel();
      const storage = await this.getStorageInfo();
      
      this.emit('device-status', {
        deviceId,
        battery,
        storage,
        timestamp: Date.now(),
        isOnline: true,
      });
    } catch (error) {
      console.error('Failed to send device status:', error);
    }
  }

  async getBatteryLevel() {
    // This would require expo-battery
    // For now, return mock data
    return {
      level: 0.85,
      state: 'unplugged',
    };
  }

  async getStorageInfo() {
    // This would require expo-file-system
    // For now, return mock data
    return {
      free: 5000000000, // 5GB
      total: 32000000000, // 32GB
    };
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
      console.log(`📤 Emitted event: ${event}`, data ? 'with data' : 'without data');
    } else {
      console.warn(`⚠️ Socket not connected, cannot emit: ${event}`);
      console.warn('Socket status:', {
        hasSocket: !!this.socket,
        isConnected: this.isConnected,
        socketId: this.socket?.id
      });
      
      // Try to reconnect if socket exists but not connected
      if (this.socket && !this.isConnected) {
        console.log('🔄 Attempting to reconnect for emit...');
        this.forceReconnect();
      }
    }
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);

    // Also register with socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    // Also remove from socket
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  disconnect() {
    console.log('Disconnecting socket service...');
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      console.log('Socket disconnected manually');
    }
  }

  isSocketConnected() {
    return this.isConnected;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      socketId: this.socket?.id,
      appState: this.appState,
    };
  }

  // Method to manually force reconnection
  async forceReconnect() {
    console.log('Forcing socket reconnection...');
    this.disconnect();
    await this.connect();
  }
}

export default new SocketService();
