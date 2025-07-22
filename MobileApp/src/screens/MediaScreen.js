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
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
// Removed: import * as Audio from 'expo-av/build/Audio';
import { Ionicons } from '@expo/vector-icons';
import MediaCaptureService from '../services/MediaCaptureService';
import MediaCaptureServiceFallback from '../services/MediaCaptureServiceFallback';
import SocketService from '../services/SocketService';
import SecurityService from '../services/SecurityService';

const { width } = Dimensions.get('window');

const MediaScreen = () => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  // Removed: const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('back');
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remoteCommandActive, setRemoteCommandActive] = useState(false);
  const [commandType, setCommandType] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const cameraReadyResolverRef = useRef(null);

  useEffect(() => {
    initializeMediaService();
    setupRemoteCommandListeners();

    return () => {
      SocketService.off('device-command', handleRemoteCommand);
    };
  }, []);

  const initializeMediaService = async () => {
    try {
      await MediaCaptureService.initialize();
      await MediaCaptureServiceFallback.initialize();
      await SecurityService.initialize();
      console.log('✅ All services initialized (Media + Security)');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      Alert.alert('Error', 'Failed to initialize camera and security services');
    }
  };

  const setupRemoteCommandListeners = () => {
    SocketService.on('device-command', handleRemoteCommand);
  };

  const closeCamera = () => {
    setShowCamera(false);
    setCameraReady(false);
    cameraReadyResolverRef.current = null;
    console.log('📷 Camera closed and reset');
  };

  const waitForCameraReady = () => {
    return new Promise((resolve, reject) => {
      if (cameraReady) {
        resolve();
        return;
      }
      
      cameraReadyResolverRef.current = resolve;
      
      // Set a timeout to reject if camera doesn't initialize
      setTimeout(() => {
        if (cameraReadyResolverRef.current === resolve) {
          cameraReadyResolverRef.current = null;
          reject(new Error('Camera failed to initialize within timeout period.'));
        }
      }, 5000); // 5 second timeout
    });
  };

  const handleRemoteCommand = async (command) => {
    const { commandId, type, data } = command;

    console.log('📨 Received remote command:', type, 'with ID:', commandId);

    try {
      setRemoteCommandActive(true);
      setCommandType(type);

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
        case 'remote_alarm':
          console.log('🚨 Processing remote alarm command...');
          await handleRemoteAlarm(commandId, data);
          break;
        case 'stop_alarm':
          console.log('🔇 Processing stop alarm command...');
          await handleStopAlarm(commandId);
          break;
        case 'stop-remote-session':
          console.log('⏹️ Processing stop-remote-session command...');
          // This case is intended to be handled by other services.
          // No action needed in MediaScreen.
          break;
        default:
          console.warn(`[MediaScreen] Received unhandled command: ${type}`);
          // Do not treat as an error, another service might handle it.
          return; // Exit without sending a failure ACK.
      }
    } catch (error) {
      console.error(`[MediaScreen] Failed to handle remote command '${type}':`, error);
      SocketService.emit('command-ack', {
        commandId,
        status: 'failed',
        error: error.message,
        timestamp: Date.now(),
      });
    } finally {
      setRemoteCommandActive(false);
      setCommandType(null);
    }
  };

  const handleRemotePhotoCapture = async (commandId, options) => {
    try {
      console.log('🎯 Starting remote photo capture...');

      if (!cameraPermission?.granted) {
        console.log('🔐 Requesting camera permissions for remote capture...');
        const result = await requestCameraPermission();
        if (!result.granted) {
          throw new Error('Camera permissions not granted.');
        }
        console.log('✅ Camera permissions granted for remote capture.');
      }

      setShowCamera(true);
      setCameraReady(false);
      console.log('📷 Camera UI shown, waiting for initialization...');

      // Wait for camera to be ready using Promise
      await waitForCameraReady();
      console.log('✅ Camera is now ready for photo capture');

      if (cameraRef.current) {
        console.log('📸 Taking remote photo...');
        MediaCaptureService.setCameraRef(cameraRef.current);
        const photo = await MediaCaptureService.captureRemotePhoto();

        console.log('✅ Remote photo captured successfully:', photo.uri);

        Alert.alert(
          'Remote Photo Captured',
          'Photo taken successfully by remote command!',
          [{ text: 'OK', onPress: closeCamera }]
        );

        SocketService.emit('command-ack', {
          commandId,
          status: 'completed',
          response: { photoUri: photo.uri },
          timestamp: Date.now()
        });
      } else {
        throw new Error('Camera reference not available.');
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

      if (!cameraPermission?.granted) {
        console.log('🔐 Requesting camera permissions for remote video...');
        const result = await requestCameraPermission();
        if (!result.granted) {
          throw new Error('Camera permissions not granted.');
        }
        console.log('✅ Camera permissions granted for remote video.');
      }

      // No explicit audio permission request here without expo-av.
      // The error will be caught in MediaCaptureService.startVideoRecording if missing.

      setShowCamera(true);
      setIsRecording(true);
      console.log('📹 Camera UI shown for video, waiting for initialization...');

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (cameraRef.current) {
        console.log('🔴 Starting video recording with fallback service...');
        MediaCaptureServiceFallback.setCameraRef(cameraRef.current);
        const duration = options?.duration || 15;

        MediaCaptureServiceFallback.captureRemoteVideoNoAudio(duration).then(() => {
          console.log('✅ Remote video capture completed (fallback)');
          setIsRecording(false);
          closeCamera();

          Alert.alert(
            'Remote Video Completed',
            `${duration} second video captured by remote command (no audio)!`
          );
        }).catch((error) => {
          console.error('Remote video capture failed (fallback):', error);
          setIsRecording(false);
          closeCamera();
          Alert.alert('Remote Video Failed', error.message);
        });

        SocketService.emit('command-ack', {
          commandId,
          status: 'started',
          response: { duration, started: true },
          timestamp: Date.now()
        });

        Alert.alert(
          'Remote Video Started',
          `Recording ${duration} second video by remote command!`
        );
      } else {
        throw new Error('Camera reference not available.');
      }
    } catch (error) {
      console.error('Failed to start remote video:', error);
      Alert.alert('Remote Video Failed', error.message);
      setIsRecording(false);
      closeCamera();

      SocketService.emit('command-ack', {
        commandId,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  };

  const handleRemoteVideoStop = async (commandId) => {
    try {
      console.log('🛑 Attempting to stop remote video recording...');
      
      if (!MediaCaptureServiceFallback.isVideoRecording()) {
        console.warn('⚠️ No active video recording found');
        
        // Still send success response to avoid hanging
        SocketService.emit('command-ack', {
          commandId,
          status: 'completed',
          response: { stopped: false, message: 'No active recording to stop' },
          timestamp: Date.now()
        });
        return;
      }

      await MediaCaptureServiceFallback.stopVideoRecordingNoAudio();
      setIsRecording(false);
      closeCamera();

      Alert.alert('Remote Video Stopped', 'Video recording stopped by remote command');

      SocketService.emit('command-ack', {
        commandId,
        status: 'completed',
        response: { stopped: true },
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to stop remote video:', error);
      setIsRecording(false);
      closeCamera();

      SocketService.emit('command-ack', {
        commandId,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      });

      Alert.alert('Error', `Failed to stop video: ${error.message}`);
    }
  };

  const handleRemoteAlarm = async (commandId, options) => {
    try {
      console.log('🚨 Starting remote alarm...');

      const duration = options?.duration || 30; // Default 30 seconds
      
      // Trigger the alarm using SecurityService
      await SecurityService.triggerAlarm(duration);

      console.log(`✅ Remote alarm started for ${duration} seconds`);

      Alert.alert(
        'Remote Alarm Started',
        `Alarm activated for ${duration} seconds by remote command!`,
        [{ text: 'OK' }]
      );

      SocketService.emit('command-ack', {
        commandId,
        status: 'completed',
        response: { 
          alarmStarted: true, 
          duration: duration,
          message: `Alarm activated for ${duration} seconds`
        },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to start remote alarm:', error);
      
      Alert.alert('Remote Alarm Failed', error.message);
      
      SocketService.emit('command-ack', {
        commandId,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  };

  const handleStopAlarm = async (commandId) => {
    try {
      console.log('🔇 Stopping remote alarm...');
      
      // Stop the alarm using SecurityService
      await SecurityService.stopAlarm();

      console.log('✅ Remote alarm stopped successfully');

      Alert.alert(
        'Remote Alarm Stopped', 
        'Alarm stopped by remote command!'
      );

      SocketService.emit('command-ack', {
        commandId,
        status: 'completed',
        response: { 
          alarmStopped: true,
          message: 'Alarm stopped successfully'
        },
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to stop remote alarm:', error);
      
      Alert.alert('Stop Alarm Failed', error.message);
      
      SocketService.emit('command-ack', {
        commandId,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      });

      throw error;
    }
  };

  const takePhoto = async () => {
    if (isProcessing || remoteCommandActive) return;

    setIsProcessing(true);
    try {
      if (!cameraPermission?.granted) {
        console.log('🔐 Requesting camera permissions for manual photo...');
        const result = await requestCameraPermission();
        if (!result.granted) {
          throw new Error('Camera permissions not granted.');
        }
      }

      setShowCamera(true);
      setCameraReady(false);
      
      // Wait for camera to be ready using Promise
      await waitForCameraReady();
      console.log('✅ Camera is now ready for manual photo capture');

      if (cameraRef.current) {
        MediaCaptureService.setCameraRef(cameraRef.current);
        const photo = await MediaCaptureService.capturePhoto();
        Alert.alert('Success', 'Photo captured successfully!', [
          { text: 'OK', onPress: closeCamera }
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
      if (!cameraPermission?.granted) {
        console.log('🔐 Requesting camera permissions for manual video...');
        const result = await requestCameraPermission();
        if (!result.granted) {
          throw new Error('Camera permissions not granted.');
        }
      }

      // No explicit audio permission request here without expo-av.
      // The error will be caught in MediaCaptureService.startVideoRecording if missing.

      if (isRecording) {
        await MediaCaptureServiceFallback.stopVideoRecordingNoAudio();
        setIsRecording(false);
        closeCamera();
        Alert.alert('Success', 'Video recording stopped (no audio)!');
      } else {
        setShowCamera(true);
        setCameraReady(false);
        setIsRecording(true);
        
        // Wait for camera to be ready using Promise
        await waitForCameraReady();
        console.log('✅ Camera is now ready for video recording');

        if (cameraRef.current) {
          MediaCaptureServiceFallback.setCameraRef(cameraRef.current);
          await MediaCaptureServiceFallback.startVideoRecordingNoAudio();
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      setIsRecording(false);
      closeCamera();
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

        <CameraView
          style={styles.camera}
          facing={cameraFacing}
          ref={cameraRef}
          onCameraReady={() => {
            console.log('📷 Camera is ready!');
            setCameraReady(true);
            if (cameraRef.current) {
              MediaCaptureService.setCameraRef(cameraRef.current);
            }
            if (cameraReadyResolverRef.current) {
              cameraReadyResolverRef.current();
              cameraReadyResolverRef.current = null;
            }
          }}
        />
        
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={closeCamera}
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
              onPress={() => setCameraFacing(cameraFacing === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
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
              name={cameraPermission?.granted ? "checkmark-circle" : "alert-circle"}
              size={24}
              color={cameraPermission?.granted ? "#4CAF50" : "#F44336"}
            />
            <Text style={styles.statusText}>
              Camera Access: {cameraPermission?.granted ? "Granted" : "Required"}
            </Text>
          </View>

          {/* Removed: Microphone Access status row (as we are not using expo-av to check it directly) */}
          {/* If you want to convey status, you'd need to assume based on errors or system prompts */}
          <View style={styles.statusRow}>
            <Ionicons
              name={"information-circle-outline"}
              size={24}
              color={"#007AFF"}
            />
            <Text style={styles.statusText}>
              Microphone Access: Required for Video (check device settings)
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

        <View style={styles.featureCard}>
          <Ionicons name="alarm-outline" size={24} color="#FF5722" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Remote Alarm System</Text>
            <Text style={styles.featureDescription}>
              Dashboard can trigger and stop device alarm remotely
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
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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