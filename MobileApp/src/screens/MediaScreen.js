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
  SafeAreaView,
  PermissionsAndroid,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
// Removed: import * as Audio from 'expo-av/build/Audio';
import { Ionicons } from '@expo/vector-icons';
import MediaCaptureService from '../services/MediaCaptureService';
import MediaCaptureServiceFallback from '../services/MediaCaptureServiceFallback';
import SocketService from '../services/SocketService';
import SecurityService from '../services/SecurityService';

const { width, height } = Dimensions.get('window');

const MediaScreen = () => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, setMicrophonePermission] = useState(null);
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
    checkMicrophonePermission();

    return () => {
      SocketService.off('device-command', handleRemoteCommand);
    };
  }, []);

  const checkMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        setMicrophonePermission(granted);
        console.log('🎤 Microphone permission status:', granted ? 'granted' : 'denied');
      } catch (error) {
        console.error('Failed to check microphone permission:', error);
        setMicrophonePermission(false);
      }
    } else {
      // On iOS, assume permission will be requested when needed
      setMicrophonePermission(true);
    }
  };

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone to record video with audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setMicrophonePermission(isGranted);
        console.log('🎤 Microphone permission request result:', isGranted ? 'granted' : 'denied');
        return isGranted;
      } catch (error) {
        console.error('Failed to request microphone permission:', error);
        setMicrophonePermission(false);
        return false;
      }
    } else {
      // On iOS, return true - permission will be requested by the system when needed
      return true;
    }
  };

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

      // Request microphone permission for video recording
      console.log('🎤 Checking microphone permission status...');
      
      // Re-check permission status right before recording
      await checkMicrophonePermission();
      
      if (!microphonePermission) {
        console.log('🎤 Requesting microphone permissions for remote video...');
        const granted = await requestMicrophonePermission();
        if (!granted) {
          throw new Error('Microphone permissions not granted. Video recording requires audio permission even for muted videos.');
        }
        console.log('✅ Microphone permissions granted for remote video.');
      } else {
        console.log('✅ Microphone permission already granted for remote video.');
      }

      setShowCamera(true);
      setIsRecording(true);
      console.log('📹 Camera UI shown for video, waiting for initialization...');

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (cameraRef.current) {
        console.log('🔴 Starting video recording with fallback service...');
        
        // Ensure the fallback service is ready and reset
        MediaCaptureServiceFallback.setCameraRef(cameraRef.current);
        
        // Add small delay to ensure camera is fully ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
      
      // Trigger the audio alarm directly using MediaCaptureService
      const audioAlarmSuccess = await MediaCaptureService.startAudioAlarm(duration);
      
      if (audioAlarmSuccess) {
        console.log(`✅ Audio alarm started successfully for ${duration} seconds`);
      } else {
        console.warn('⚠️ Audio alarm failed, falling back to SecurityService haptic alarm');
        // Fallback to SecurityService for haptic feedback
        await SecurityService.triggerAlarm(duration);
      }

      console.log(`✅ Remote alarm started for ${duration} seconds`);

      Alert.alert(
        'Remote Alarm Started',
        `Audio alarm activated for ${duration} seconds by remote command!\n\nYou should hear beeping sounds if device is not muted.`,
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
      
      // Stop both audio alarm and haptic alarm
      await MediaCaptureService.stopAudioAlarm();
      await SecurityService.stopAlarm();

      console.log('✅ Remote alarm stopped successfully');

      Alert.alert(
        'Remote Alarm Stopped', 
        'Audio alarm stopped by remote command!'
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

      // Request microphone permission for video recording
      console.log('🎤 Checking microphone permission status...');
      
      // Re-check permission status right before recording
      await checkMicrophonePermission();
      
      if (!microphonePermission) {
        console.log('🎤 Requesting microphone permissions for manual video...');
        const granted = await requestMicrophonePermission();
        if (!granted) {
          throw new Error('Microphone permissions not granted. Video recording requires audio permission even for muted videos.');
        }
        console.log('✅ Microphone permissions granted for manual video.');
      } else {
        console.log('✅ Microphone permission already granted for manual video.');
      }

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
        { 
          borderColor: disabled ? '#e0e6ed' : color, 
          opacity: disabled ? 0.6 : 1,
          backgroundColor: disabled ? '#f8fafb' : `${color}10`
        }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.mediaButtonIcon, { backgroundColor: disabled ? '#e0e6ed' : `${color}20` }]}>
        <Ionicons name={icon} size={28} color={disabled ? '#b2bec3' : color} />
      </View>
      <Text style={[styles.mediaButtonTitle, { color: disabled ? '#b2bec3' : '#2d3436' }]}>{title}</Text>
      <Text style={styles.mediaButtonSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  if (showCamera) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        {remoteCommandActive && (
          <View style={styles.remoteIndicator}>
            <View style={styles.remoteIndicatorIcon}>
              <ActivityIndicator size="small" color="white" />
            </View>
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
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.topControlButton}
              onPress={closeCamera}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            
            <View style={styles.cameraInfo}>
              <Text style={styles.cameraInfoText}>
                {cameraFacing === 'back' ? '📷 Back Camera' : '🤳 Front Camera'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.topControlButton}
              onPress={() => setCameraFacing(cameraFacing === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Center Status */}
          {isRecording && (
            <View style={styles.centerStatus}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>REC</Text>
              </View>
              <Text style={styles.recordingTimer}>Recording in progress...</Text>
            </View>
          )}

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <View style={styles.cameraHint}>
              <Ionicons name="information-circle" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.hintText}>
                {remoteCommandActive 
                  ? `Processing ${commandType} remotely` 
                  : isRecording 
                    ? 'Recording video without audio'
                    : 'Camera ready for capture'
                }
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📸 Media Center</Text>
            <Text style={styles.subtitle}>Remote Capture & Control</Text>
          </View>

          {remoteCommandActive && (
            <View style={styles.remoteCommandBanner}>
              <View style={styles.bannerIcon}>
                <ActivityIndicator size="small" color="white" />
              </View>
              <Text style={styles.remoteCommandText}>
                Processing remote {commandType} command...
              </Text>
            </View>
          )}

          {/* Manual Capture Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Manual Capture</Text>

            <View style={styles.buttonGrid}>
              <MediaButton
                title="Take Photo"
                subtitle="Capture image"
                icon="camera"
                onPress={takePhoto}
                color="#00b894"
                disabled={isProcessing || remoteCommandActive}
              />

              <MediaButton
                title={isRecording ? "Stop Recording" : "Record Video"}
                subtitle={isRecording ? "Stop recording" : "Start recording"}
                icon="videocam"
                onPress={recordVideo}
                color={isRecording ? "#e17055" : "#0984e3"}
                disabled={isProcessing || remoteCommandActive}
              />
            </View>
          </View>

          {/* Connection Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔗 System Status</Text>

            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View style={[styles.statusIcon, SocketService.isSocketConnected() && styles.statusIconConnected]}>
                  <Ionicons
                    name={SocketService.isSocketConnected() ? "wifi" : "wifi-off"}
                    size={20}
                    color={SocketService.isSocketConnected() ? "#00b894" : "#e17055"}
                  />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>Remote Control</Text>
                  <Text style={[styles.statusSubtitle, 
                    { color: SocketService.isSocketConnected() ? "#00b894" : "#e17055" }
                  ]}>
                    {SocketService.isSocketConnected() ? "Connected" : "Disconnected"}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={[styles.statusIcon, cameraPermission?.granted && styles.statusIconConnected]}>
                  <Ionicons
                    name={cameraPermission?.granted ? "checkmark-circle" : "alert-circle"}
                    size={20}
                    color={cameraPermission?.granted ? "#00b894" : "#e17055"}
                  />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>Camera Access</Text>
                  <Text style={[styles.statusSubtitle, 
                    { color: cameraPermission?.granted ? "#00b894" : "#e17055" }
                  ]}>
                    {cameraPermission?.granted ? "Granted" : "Required"}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <View style={[styles.statusIcon, microphonePermission && styles.statusIconConnected]}>
                  <Ionicons
                    name={microphonePermission ? "checkmark-circle" : "alert-circle"}
                    size={20}
                    color={microphonePermission ? "#00b894" : "#e17055"}
                  />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>Microphone Access</Text>
                  <Text style={[styles.statusSubtitle, 
                    { color: microphonePermission ? "#00b894" : "#e17055" }
                  ]}>
                    {microphonePermission ? "Granted" : "Required for Video"}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
                <View style={styles.statusIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#74b9ff"
                  />
                </View>
                <View style={styles.statusContent}>
                  <Text style={styles.statusTitle}>Media Library</Text>
                  <Text style={[styles.statusSubtitle, { color: "#74b9ff" }]}>
                    Auto-requested when capturing media
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Remote Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Remote Features</Text>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="camera-outline" size={24} color="#00b894" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Remote Photo Capture</Text>
                <Text style={styles.featureDescription}>
                  Dashboard can trigger photo capture remotely
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="videocam-outline" size={24} color="#0984e3" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Remote Video Recording</Text>
                <Text style={styles.featureDescription}>
                  Dashboard can start/stop video recording
                </Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="alarm-outline" size={24} color="#e17055" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Remote Alarm System</Text>
                <Text style={styles.featureDescription}>
                  Dashboard can trigger and stop device alarm remotely
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              📱 Media Capture Service v2.0
            </Text>
            <Text style={styles.footerSubtext}>
              Status: {SocketService.isSocketConnected() ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 18,
    paddingLeft: 4,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 130,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mediaButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#f1f2f6',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    textAlign: 'center',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: '#636e72',
    textAlign: 'center',
  },
  remoteCommandBanner: {
    backgroundColor: '#667eea',
    marginHorizontal: -24,
    marginBottom: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerIcon: {
    marginRight: 14,
    marginLeft: 24,
  },
  remoteCommandText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 24,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  statusIconConnected: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#636e72',
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  featureIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingBottom: 48,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#636e72',
  },
  // Camera-specific styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
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
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  topControlButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cameraInfoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    textAlign: 'center',
  },
  centerStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(214, 48, 49, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    marginRight: 12,
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  recordingTimer: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  bottomInfo: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  cameraHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'center',
  },
  hintText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
  },
  remoteIndicator: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.95)',
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginHorizontal: 24,
    borderRadius: 30,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  remoteIndicatorIcon: {
    marginRight: 12,
  },
  remoteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default MediaScreen;