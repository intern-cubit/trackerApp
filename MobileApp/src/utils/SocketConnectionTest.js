import SocketService from '../services/SocketService';

export class SocketConnectionTest {
  static async testConnection() {
    try {
      console.log('🔍 Testing Socket Connection...');
      
      // Check if already connected
      const status = SocketService.getConnectionStatus();
      console.log('📊 Current Status:', status);
      
      if (!status.connected) {
        console.log('🔌 Attempting to connect...');
        await SocketService.connect();
        
        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newStatus = SocketService.getConnectionStatus();
        console.log('📊 New Status:', newStatus);
        
        if (newStatus.connected) {
          console.log('✅ Socket connected successfully!');
          
          // Test ping
          SocketService.emit('ping');
          console.log('📡 Ping sent');
          
          return true;
        } else {
          console.log('❌ Socket connection failed');
          return false;
        }
      } else {
        console.log('✅ Socket already connected!');
        
        // Test ping for existing connection
        SocketService.emit('ping');
        console.log('📡 Ping sent to existing connection');
        
        return true;
      }
    } catch (error) {
      console.error('❌ Socket connection test failed:', error);
      return false;
    }
  }

  static async testRemoteCommand() {
    try {
      console.log('🧪 Testing Remote Command Reception...');
      
      // Listen for test command
      const testPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        SocketService.on('test-command', (data) => {
          clearTimeout(timeout);
          console.log('✅ Received test command:', data);
          resolve(true);
        });
      });

      console.log('⏳ Waiting for test command (5 seconds)...');
      const result = await testPromise;
      
      if (result) {
        console.log('✅ Remote command test passed!');
      } else {
        console.log('⏰ Remote command test timed out');
      }

      return result;
    } catch (error) {
      console.error('❌ Remote command test failed:', error);
      return false;
    }
  }

  static logConnectionDetails() {
    const status = SocketService.getConnectionStatus();
    console.log('📋 Socket Connection Details:', {
      connected: status.connected,
      socketId: status.socketId,
      reconnectAttempts: status.reconnectAttempts,
      appState: status.appState,
      timestamp: new Date().toISOString()
    });
  }
}
