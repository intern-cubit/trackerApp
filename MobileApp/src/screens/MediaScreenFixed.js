import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import MediaCaptureService from '../services/MediaCaptureService';
import SocketService from '../services/SocketService';

const { width } = Dimensions.get('window');

const MediaScreen = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraType, setCameraType] = useState('back');
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remoteCommandActive, setRemoteCommandActive] = useState(false);
  const [commandType, setCommandType] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    initializeMediaService();
    setupRemoteCommandListeners();
    
    return () => {
      // Cleanup listeners
      SocketService.off('device-command', handleRemoteCommand);
    };
  }, []);

  const initializeMediaService = async () => {
    try {
      await MediaCaptureService.initialize();
      setHasPermissions(MediaCaptureService.hasRequiredPermissions());
    } catch (error) {
      console.error('Failed to initialize media service:', error);
      Alert.alert('Error', 'Failed to initialize camera services');
    }
  };

  const setupRemoteCommandListeners = () => {
    // Listen for remote commands from dashboard
    SocketService.on('device-command', handleRemoteCommand);
  };

  const handleRemoteCommand = async (command) => {
    const { commandId, type, data } = command;
    
    console.log('📨 Received remote command:', type, 'with ID:', commandId);
    
    try {
      setRemoteCommandActive(true);
      setCommandType(type);
      
      // Send acknowledgment
      SocketService.emit('command-ack', {
        commandId,
        status: 'received',
        timestamp: Date.now()
      });

      switch (type) {
        case 'capture-photo':
          console.log('📸 Processing capture-photo command...');
          await handleRemotePhotoCapture(commandId, data);
          break;
        case 'start-video':
          console.log('🎥 Processing start-video command...');
          await handleRemoteVideoStart(commandId, data);
          break;
        case 'stop-video':
          console.log('⏹️ Processing stop-video command...');
          await handleRemoteVideoStop(commandId);
          break;
        default:
          console.error('❌ Unknown remote command:', type);
          SocketService.emit('command-ack', {
            commandId,
            status: 'failed',
            error: `Unknown command: ${type}`,
            timestamp: Date.now()
          });
          throw new Error(`Unknown command: ${type}`);
      }
    } catch (error) {
      console.error('Failed to handle remote command:', error);
      SocketService.emit('command-ack', {
        commandId,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      });
    } finally {
      setRemoteCommandActive(false);
      setCommandType(null);
    }
  };

  const ensureCameraPermissions = async () => {
    try {
      console.log('🔐 Checking camera permissions...');
      
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('📋 Camera permission status:', status);
      
      if (status === 'granted') {
        setHasPermissions(true);
        console.log('✅ Camera permissions granted');
      } else {
        setHasPermissions(false);
        throw new Error('Camera permission denied');
      }
    } catch (error) {
      console.error('❌ Permission error:', error);
      throw new Error('Failed to get camera permissions');
    }
  };

  const handleRemotePhotoCapture = async (commandId, options) => {
    try {
      console.log('🎯 Starting remote photo capture...');
      
      // Check and request permissions if needed
      await ensureCameraPermissions();
      
      if (!hasPermissions) {
        throw new Error('Camera permissions not granted');
      }

      setShowCamera(true);
      console.log('📷 Camera UI shown, waiting for initialization...');
      
      // Wait a moment for camera to initialize
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (cameraRef.current) {
        console.log('📸 Taking remote photo...');
        MediaCaptureService.setCameraRef(cameraRef.current);
        const photo = await MediaCaptureService.captureRemotePhoto();
        
        console.log('✅ Remote photo captured successfully:', photo.uri);
        
        Alert.alert(
          'Remote Photo Captured',
          'Photo taken successfully by remote command!',
          [{ text: 'OK', onPress: () => setShowCamera(false) }]
        );
        
        SocketService.emit('command-ack', {
          commandId,
          status: 'completed',
          response: { photoUri: photo.uri },
          timestamp: Date.now()
        });
      } else {
        throw new Error('Camera reference not available');
      }
    } catch (error) {
      console.error('Failed to capture remote photo:', error);
      Alert.alert('Remote Capture Failed', error.message);
      throw error;
    }
  };

  const handleRemoteVideoStart = async (commandId, options) => {
    try {
      console.log('🎥 Starting remote video recording...');
      
      // Check and request permissions if needed
      await ensureCameraPermissions();
      
      if (!hasPermissions) {
        throw new Error('Camera permissions not granted');
      }

      setShowCamera(true);
      setIsRecording(true);
      console.log('📹 Camera UI shown for video, waiting for initialization...');
      
      // Wait a moment for camera to initialize
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (cameraRef.current) {
        console.log('🔴 Starting video recording...');
        MediaCaptureService.setCameraRef(cameraRef.current);
        const duration = options?.duration || 15;
        await MediaCaptureService.captureRemoteVideo(duration);
        
        Alert.alert(
          'Remote Video Started',
          `Recording ${duration} second video by remote command!`
        );
        
        // Auto-stop after duration
        setTimeout(() => {
          setIsRecording(false);
          setShowCamera(false);
        }, duration * 1000);
        
        SocketService.emit('command-ack', {
          commandId,
          status: 'completed',
          response: { duration },
          timestamp: Date.now()
        });
      } else {
        throw new Error('Camera reference not available');
      }
    } catch (error) {
      console.error('Failed to start remote video:', error);
      Alert.alert('Remote Video Failed', error.message);
      setIsRecording(false);
      throw error;
    }
  };

  const handleRemoteVideoStop = async (commandId) => {
    try {
      if (MediaCaptureService.isVideoRecording()) {
        await MediaCaptureService.stopVideoRecording();
        setIsRecording(false);
        setShowCamera(false);
        
        Alert.alert('Remote Video Stopped', 'Video recording stopped by remote command');
        
        SocketService.emit('command-ack', {
          commandId,
          status: 'completed',
          response: { stopped: true },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Failed to stop remote video:', error);
      throw error;
    }
  };

  const takePhoto = async () => {
    if (isProcessing || remoteCommandActive) return;
    
    setIsProcessing(true);
    try {
      if (!hasPermissions) {
        await ensureCameraPermissions();
      }
      
      setShowCamera(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (cameraRef.current) {
        MediaCaptureService.setCameraRef(cameraRef.current);
        const photo = await MediaCaptureService.capturePhoto();
        Alert.alert('Success', 'Photo captured successfully!', [
          { text: 'OK', onPress: () => setShowCamera(false) }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const recordVideo = async () => {
    if (isProcessing || remoteCommandActive) return;
    
    setIsProcessing(true);
    try {
      if (!hasPermissions) {
        await ensureCameraPermissions();
      }
      
      if (isRecording) {
        await MediaCaptureService.stopVideoRecording();
        setIsRecording(false);
        setShowCamera(false);
        Alert.alert('Success', 'Video recording stopped!');
      } else {
        setShowCamera(true);
        setIsRecording(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (cameraRef.current) {
          MediaCaptureService.setCameraRef(cameraRef.current);
          await MediaCaptureService.startVideoRecording();
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      setIsRecording(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const MediaButton = ({ title, subtitle, icon, onPress, color = '#007AFF', disabled = false }) => (
    <TouchableOpacity 
      style={[
        styles.mediaButton, 
        { borderColor: disabled ? '#ccc' : color, opacity: disabled ? 0.5 : 1 }
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={32} color={disabled ? '#ccc' : color} />
      <Text style={[styles.mediaButtonTitle, { color: disabled ? '#ccc' : color }]}>{title}</Text>
      <Text style={styles.mediaButtonSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        {remoteCommandActive && (
          <View style={styles.remoteIndicator}>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.remoteText}>
              Remote {commandType} in progress...
            </Text>
          </View>
        )}
        
        <Camera
          style={styles.camera}
          type={cameraType}
          ref={cameraRef}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>REC</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => setCameraType(cameraType === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Media Center</Text>
      
      {remoteCommandActive && (
        <View style={styles.remoteCommandBanner}>
          <ActivityIndicator size="small" color="#FF6B6B" />
          <Text style={styles.remoteCommandText}>
            Processing remote {commandType} command...
          </Text>
        </View>
      )}
      
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Manual Capture</Text>
        
        <View style={styles.buttonGrid}>
          <MediaButton
            title="Take Photo"
            subtitle="Capture image"
            icon="camera"
            onPress={takePhoto}
            color="#4CAF50"
            disabled={isProcessing || remoteCommandActive}
          />
          
          <MediaButton
            title={isRecording ? "Stop Recording" : "Record Video"}
            subtitle={isRecording ? "Stop recording" : "Start recording"}
            icon="videocam"
            onPress={recordVideo}
            color={isRecording ? "#F44336" : "#FF5722"}
            disabled={isProcessing || remoteCommandActive}
          />
        </View>
      </View>

      <View style={styles.featuresContainer}>
        <Text style={styles.sectionTitle}>Remote Features</Text>
        
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={SocketService.isSocketConnected() ? "wifi" : "wifi-off"} 
              size={24} 
              color={SocketService.isSocketConnected() ? "#4CAF50" : "#F44336"} 
            />
            <Text style={styles.statusText}>
              Remote Control: {SocketService.isSocketConnected() ? "Connected" : "Disconnected"}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Ionicons 
              name={hasPermissions ? "checkmark-circle" : "alert-circle"} 
              size={24} 
              color={hasPermissions ? "#4CAF50" : "#F44336"} 
            />
            <Text style={styles.statusText}>
              Camera Access: {hasPermissions ? "Granted" : "Required"}
            </Text>
          </View>
        </View>
        
        <View style={styles.featureCard}>
          <Ionicons name="camera-outline" size={24} color="#007AFF" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Remote Photo Capture</Text>
            <Text style={styles.featureDescription}>
              Dashboard can trigger photo capture remotely
            </Text>
          </View>
        </View>
        
        <View style={styles.featureCard}>
          <Ionicons name="videocam-outline" size={24} color="#007AFF" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Remote Video Recording</Text>
            <Text style={styles.featureDescription}>
              Dashboard can start/stop video recording
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  remoteCommandBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  remoteCommandText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  actionsContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  mediaButton: {
    width: (width - 80) / 2,
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  mediaButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  mediaButtonSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  featuresContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  featureText: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  remoteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  remoteText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default MediaScreen;
