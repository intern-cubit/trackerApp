import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from './SocketService';
import { API_BASE_URL } from '../config/api';
import { Alert, Platform } from 'react-native';
// import * as Notifications from 'expo-notifications'; // <--- REMOVED
import { Audio, Video } from 'expo-av'; // Enhanced expo-av import for audio and video
import * as ImagePicker from 'expo-image-picker'; // Added for enhanced media capture

class MediaCaptureService {
  constructor() {
    this.cameraRef = null;
    this.videoRef = null; // Added for expo-av video recording
    this.isRecording = false;
    this.hasPermissions = false;
    this.currentRecordingPromise = null;
    this.isAlarmPlaying = false;
    this.alarmInterval = null;
    this.beepSoundObject = null; // To hold the loaded sound object for expo-av
    this.videoRecordingObject = null; // For expo-av video recording
  }

  async initialize() {
    try {
      console.log('🎥 Initializing MediaCaptureService with enhanced expo-av support...');

      // Request media library permissions
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      console.log('📋 Media Library permission status:', mediaLibraryPermission.status);

      // For expo-camera v16+, we'll handle camera permissions in the component level
      // using useCameraPermissions hook, not here in the service
      console.log('📷 Camera permissions will be handled at component level with useCameraPermissions hook');

      // Request image picker permissions for fallback capture
      const imagePickerPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Image Picker permission status:', imagePickerPermission.status);

      this.hasPermissions = mediaLibraryPermission.status === 'granted';

      if (!this.hasPermissions) {
        console.warn('⚠️ Some permissions not granted');
        console.log('📋 Media Library granted:', mediaLibraryPermission.status === 'granted');
        console.log('📷 Camera granted:', cameraPermission.status === 'granted');
      } else {
        console.log('✅ All permissions granted for enhanced media capture');
      }

      // Pre-load the alarm sound for expo-av
      await this.loadAlarmSound();

      console.log('🎥 Enhanced media capture service initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize media capture service:', error);
    }
  }

  // Enhanced permission checking for media library and image picker
  async checkAndRequestPermissions() {
    try {
      console.log('📋 Checking enhanced permissions (media library + image picker)...');
      
      // Check media library permissions
      const mediaLibraryPermission = await MediaLibrary.getPermissionsAsync();
      let mediaLibraryGranted = true;
      if (mediaLibraryPermission.status !== 'granted') {
        const result = await MediaLibrary.requestPermissionsAsync();
        mediaLibraryGranted = result.status === 'granted';
      }
      
      // Camera permissions are handled at component level with useCameraPermissions hook
      // We'll assume camera is available and handle errors in capture methods
      const cameraGranted = true; // Will be validated during actual capture
      
      // Check image picker permissions
      const imagePickerPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      let imagePickerGranted = true;
      if (imagePickerPermission.status !== 'granted') {
        const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
        imagePickerGranted = result.status === 'granted';
      }
      
      this.hasPermissions = mediaLibraryGranted && imagePickerGranted;
      
      console.log('📋 Enhanced permissions check result:');
      console.log('  - Media Library:', mediaLibraryGranted);
      console.log('  - Camera: (handled at component level)');
      console.log('  - Image Picker:', imagePickerGranted);
      console.log('  - Overall:', this.hasPermissions);
      
      return this.hasPermissions;
    } catch (error) {
      console.error('Error checking enhanced permissions:', error);
      return false;
    }
  }

  setCameraRef(ref) {
    // If we're changing camera ref while recording, clean up first
    if (this.cameraRef && this.isRecording && ref !== this.cameraRef) {
      console.warn('⚠️ Camera reference changing while recording, cleaning up...');
      this.forceStopRecording();
    }
    
    this.cameraRef = ref;
    if (ref) {
      console.log('📸 Camera reference set.');
      console.log('📝 Note: Camera permissions should be handled in the Camera component using useCameraPermissions hook');
    } else {
      console.log('📸 Camera reference cleared.');
      // Clean up any ongoing recording when camera ref is removed
      if (this.isRecording) {
        console.log('🛑 Cleaning up recording state due to camera ref removal...');
        this.forceStopRecording();
      }
    }
  }

  setVideoRef(ref) {
    this.videoRef = ref;
    if (ref) {
      console.log('🎥 Video reference set for expo-av.');
    }
  }

  async capturePhoto(options = {}) {
    try {
      if (!this.cameraRef) {
        throw new Error('Camera reference not available. Ensure camera is open and permissions granted.');
      }
      const mediaLibraryPermission = await MediaLibrary.getPermissionsAsync();
      if (mediaLibraryPermission.status !== 'granted') {
        const result = await MediaLibrary.requestPermissionsAsync();
        if (result.status !== 'granted') {
          throw new Error('Media library permissions not granted. Cannot save photo.');
        }
      }
      console.log('📸 Taking picture...');
      const photo = await this.cameraRef.takePictureAsync({
        quality: options.quality || 0.8,
        base64: options.includeBase64 || false,
        skipProcessing: false,
      });
      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo - no image data returned.');
      }
      console.log('✅ Photo captured:', photo.uri);
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      console.log('📱 Photo saved to gallery');
      try {
        await this.uploadMedia(photo.uri, 'photo', options.isRemote || false);
        console.log('☁️ Photo uploaded to server successfully');
      } catch (uploadError) {
        console.warn('⚠️ Photo upload failed, but photo was saved locally:', uploadError.message);
      }
      console.log('📸 Photo capture completed successfully');
      return photo;
    } catch (error) {
      console.error('❌ Failed to capture photo:', error);
      throw error;
    }
  }

  async startVideoRecording(options = {}) {
    try {
      if (!this.cameraRef || this.isRecording) {
        throw new Error('Cannot start video recording: Camera reference not available or already recording.');
      }
      const mediaLibraryPermission = await MediaLibrary.getPermissionsAsync();
      if (mediaLibraryPermission.status !== 'granted') {
        const result = await MediaLibrary.requestPermissionsAsync();
        if (result.status !== 'granted') {
          throw new Error('Media library permissions not granted. Cannot save video.');
        }
      }
      console.log('🎥 Starting video recording...');
      const recordingOptions = {
        quality: options.quality || '720p',
        maxDuration: options.maxDuration || 30, // 30 seconds default
        mute: true, // Always force mute to avoid permission issues
      };
      console.log('🔇 Starting muted video recording to avoid audio permission issues');
      try {
        const recordingPromise = this.cameraRef.recordAsync(recordingOptions);
        this.isRecording = true;
        this.currentRecordingPromise = recordingPromise;
        console.log('✅ Video recording started (audio muted to avoid permission issues).');
        return { status: 'recording_started', audioMuted: true };
      } catch (recordError) {
        console.error('Failed to start video recording:', recordError);
        this.isRecording = false;
        this.currentRecordingPromise = null;
        if (recordError.message.includes('RECORD_AUDIO')) {
          throw new Error('Cannot start video recording: Audio permission required. Please use the fallback service.');
        } else if (recordError.message.includes('CAMERA')) {
          throw new Error('Cannot start video recording: Missing camera permission. Please grant camera permission in device settings.');
        } else {
          throw new Error(`Cannot start video recording: ${recordError.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to start video recording:', error);
      this.isRecording = false;
      throw error;
    }
  }

  async stopVideoRecording() {
    try {
      console.log('🛑 Stopping video recording...');
      
      // Reset recording state first to prevent conflicts
      const wasRecording = this.isRecording;
      const hadPromise = !!this.currentRecordingPromise;
      
      if (!this.cameraRef) {
        console.warn('⚠️ Camera reference not available during stop');
        // Clean up state even if camera ref is missing
        this.isRecording = false;
        this.currentRecordingPromise = null;
        
        if (wasRecording) {
          throw new Error('Camera reference lost during recording. Recording may have been interrupted.');
        } else {
          throw new Error('Camera reference not available.');
        }
      }
      
      if (!wasRecording && !hadPromise) {
        console.warn('⚠️ No active video recording to stop');
        this.isRecording = false;
        this.currentRecordingPromise = null;
        throw new Error('No active video recording to stop.');
      }
      
      try {
        // Set flags to false before stopping to prevent race conditions
        this.isRecording = false;
        
        if (this.cameraRef && this.cameraRef.stopRecording) {
          this.cameraRef.stopRecording();
        }
        
        let video = null;
        if (this.currentRecordingPromise) {
          try {
            video = await this.currentRecordingPromise;
          } catch (recordingError) {
            console.warn('Recording promise rejected:', recordingError.message);
            // Don't throw here, recording might have completed successfully
          }
        }
        
        // Clear the promise
        this.currentRecordingPromise = null;
        
        if (!video || !video.uri) {
          console.warn('Video recording completed but no valid video data returned');
          // Don't throw error if we were just cleaning up state
          if (wasRecording) {
            throw new Error('Video recording failed - no video data returned.');
          } else {
            return null; // Just cleanup, no actual recording was happening
          }
        }
        
        console.log('✅ Video recording completed:', video.uri);
        
        // Save to gallery
        try {
          const asset = await MediaLibrary.createAssetAsync(video.uri);
          console.log('📱 Video saved to gallery');
        } catch (saveError) {
          console.warn('Failed to save video to gallery:', saveError.message);
        }
        
        // Upload to server
        try {
          await this.uploadMedia(video.uri, 'video', true);
          console.log('☁️ Video uploaded to server');
        } catch (uploadError) {
          console.warn('⚠️ Video upload failed:', uploadError.message);
        }
        
        console.log('🎥 Video recording process completed successfully');
        return video;
        
      } catch (recordingError) {
        console.error('Error during video recording stop:', recordingError);
        this.isRecording = false;
        this.currentRecordingPromise = null;
        
        // Handle specific error types
        if (recordingError.message && recordingError.message.includes('RECORD_AUDIO')) {
          throw new Error('Video recording failed due to missing audio permission. Recording was muted but system still requires audio permission.');
        } else if (recordingError.message && recordingError.message.includes('Camera reference lost')) {
          throw recordingError; // Re-throw as is
        } else {
          throw new Error(`Video recording stop failed: ${recordingError.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to stop video recording:', error);
      // Ensure state is cleaned up regardless of error
      this.isRecording = false;
      this.currentRecordingPromise = null;
      throw error;
    }
  }

  async captureRemotePhoto() {
    try {
      console.log('📸 Starting enhanced remote photo capture...');
      console.log('📋 Camera ref available:', !!this.cameraRef);
      
      let photo;
      
      if (this.cameraRef) {
        // Use camera ref if available (primary method)
        photo = await this.capturePhoto({
          isRemote: true,
          quality: 0.7,
          includeBase64: false
        });
      } else {
        // Silent background capture without opening camera UI
        console.log('📸 Camera ref not available, attempting silent background capture...');
        
        try {
          // Try to use silent media capture method
          const media = await this.captureSilentBackgroundPhoto();
          photo = { uri: media.uri };
          
          // Save to media library
          if (photo.uri) {
            const asset = await MediaLibrary.createAssetAsync(photo.uri);
            console.log('📱 Silent photo saved to gallery');
          }
        } catch (silentError) {
          console.warn('⚠️ Silent capture failed, this requires camera ref to be available:', silentError.message);
          throw new Error('Remote photo capture requires active camera. Please ensure the camera screen is open or camera permissions are granted.');
        }
      }
      
      if (!photo || !photo.uri) {
        throw new Error('Photo capture returned empty result.');
      }
      
      console.log('✅ Enhanced remote photo captured successfully:', photo.uri);
      
      // Upload to server
      try {
        await this.uploadMedia(photo.uri, 'photo', true);
        console.log('☁️ Remote photo uploaded to server successfully');
      } catch (uploadError) {
        console.warn('⚠️ Photo upload failed:', uploadError.message);
      }
      
      SocketService.emit('media-captured', {
        type: 'photo',
        uri: photo.uri,
        timestamp: Date.now(),
        isRemote: true,
        method: this.cameraRef ? 'camera-ref' : 'silent-background'
      });
      
      return photo;
    } catch (error) {
      console.error('❌ Failed to capture enhanced remote photo:', error);
      throw error;
    }
  }

  async captureRemoteVideo(duration = 15) {
    try {
      console.log(`🎥 Starting enhanced remote video capture for ${duration} seconds...`);
      console.log('📋 Camera ref available:', !!this.cameraRef);
      
      if (this.cameraRef) {
        // Use existing camera ref method (primary)
        const result = await this.startVideoRecording({
          maxDuration: duration,
          quality: '480p',
          isRemote: true,
          forceNoAudio: true,
        });
        
        if (result.audioMuted) {
          console.log('🔇 Remote video recording started without audio (intentional for remote capture)');
        }
        
        console.log(`🎥 Camera ref video recording started for ${duration} seconds...`);
        
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              await this.stopVideoRecording();
              console.log('🎥 Remote video recording completed, processing...');
              SocketService.emit('media-captured', {
                type: 'video',
                duration: duration,
                timestamp: Date.now(),
                isRemote: true,
                status: 'completed',
                audioMuted: result.audioMuted || true,
                method: 'camera-ref'
              });
              console.log('✅ Remote video capture completed via camera ref.');
              resolve({ duration, timestamp: Date.now(), audioMuted: result.audioMuted || true, method: 'camera-ref' });
            } catch (error) {
              console.error('Failed to complete remote video capture (during stop):', error);
              reject(error);
            }
          }, duration * 1000);
        });
        
      } else {
        // Silent background video capture without opening camera UI
        console.log('🎥 Camera ref not available, attempting silent background video capture...');
        
        try {
          // Try to use silent media capture method
          const media = await this.captureSilentBackgroundVideo(duration);
          const video = { uri: media.uri };
          
          // Save to media library
          if (video.uri) {
            const asset = await MediaLibrary.createAssetAsync(video.uri);
            console.log('📱 Silent video saved to gallery');
            
            // Upload to server
            try {
              await this.uploadMedia(video.uri, 'video', true);
              console.log('☁️ Silent video uploaded to server');
            } catch (uploadError) {
              console.warn('⚠️ Video upload failed:', uploadError.message);
            }
          }
          
          SocketService.emit('media-captured', {
            type: 'video',
            duration: duration,
            timestamp: Date.now(),
            isRemote: true,
            status: 'completed',
            audioMuted: true, // Silent videos are always muted for security
            method: 'silent-background'
          });
          
          console.log('✅ Remote video capture completed via silent background method.');
          return { duration, timestamp: Date.now(), audioMuted: true, method: 'silent-background' };
          
        } catch (silentError) {
          console.warn('⚠️ Silent video capture failed:', silentError.message);
          
          // If video capture fails due to audio permission, try photo capture as fallback
          if (silentError.message.includes('RECORD_AUDIO') || silentError.message.includes('audio permission')) {
            console.log('📸 Video failed due to audio permission, attempting photo capture as fallback...');
            
            try {
              const photo = await this.captureSilentBackgroundPhoto();
              
              // Save to media library
              if (photo.uri) {
                const asset = await MediaLibrary.createAssetAsync(photo.uri);
                console.log('📱 Fallback photo saved to gallery');
                
                // Upload to server
                try {
                  await this.uploadMedia(photo.uri, 'photo', true);
                  console.log('☁️ Fallback photo uploaded to server');
                } catch (uploadError) {
                  console.warn('⚠️ Photo upload failed:', uploadError.message);
                }
              }
              
              SocketService.emit('media-captured', {
                type: 'photo', // Note: type is photo, not video
                timestamp: Date.now(),
                isRemote: true,
                status: 'completed_fallback',
                method: 'photo-fallback-from-video',
                originalRequest: 'video',
                fallbackReason: 'audio_permission_denied'
              });
              
              console.log('✅ Remote capture completed with photo fallback due to video permission issues.');
              return { 
                type: 'photo',
                timestamp: Date.now(), 
                method: 'photo-fallback-from-video',
                fallbackReason: 'audio_permission_denied'
              };
              
            } catch (photoError) {
              console.error('❌ Photo fallback also failed:', photoError.message);
              throw new Error(`Remote video capture failed due to audio permission, and photo fallback also failed: ${photoError.message}`);
            }
          } else {
            throw new Error('Remote video capture requires active camera. Please ensure the camera screen is open or camera permissions are granted.');
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to capture enhanced remote video:', error);
      throw error;
    }
  }

  async uploadMedia(uri, type, isRemote = false) {
    try {
      console.log('📤 Starting media upload...', { uri, type, isRemote });
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: type === 'photo' ? 'image/jpeg' : 'video/mp4',
        name: `${type}_${Date.now()}.${type === 'photo' ? 'jpg' : 'mp4'}`,
      });
      formData.append('type', type);
      formData.append('isRemote', isRemote.toString());
      formData.append('timestamp', Date.now().toString());
      const deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        throw new Error('Device ID not found in storage');
      }
      formData.append('deviceId', deviceId);
      console.log('📤 Uploading to:', `${API_BASE_URL}/api/media/upload`);
      console.log('📤 Device ID:', deviceId);
      const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
        method: 'POST',
        body: formData,
      });
      console.log('📤 Upload response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload response error:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log('✅ Media uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to upload media:', error);
      if (error.message.includes('Network request failed')) {
        console.error('❌ Network connectivity issue - check if backend is running');
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  }

  async getMediaHistory() {
    try {
      const history = await AsyncStorage.getItem('mediaHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Failed to get media history:', error);
      return [];
    }
  }

  async saveMediaToHistory(media) {
    try {
      const history = await this.getMediaHistory();
      history.push({
        ...media,
        timestamp: Date.now(),
      });
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      await AsyncStorage.setItem('mediaHistory', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save media to history:', error);
    }
  }

  isVideoRecording() {
    return this.isRecording;
  }

  hasRequiredPermissions() {
    return this.hasPermissions;
  }

  // Force cleanup of any recording state (useful when camera is reset)
  forceStopRecording() {
    try {
      console.log('🛑 Force stopping/cleaning up recording state...');
      
      const wasRecording = this.isRecording;
      
      // Reset all recording state
      this.isRecording = false;
      this.currentRecordingPromise = null;
      
      // Try to stop camera recording if possible
      if (this.cameraRef && this.cameraRef.stopRecording && wasRecording) {
        try {
          this.cameraRef.stopRecording();
          console.log('📹 Camera recording stopped during force cleanup');
        } catch (stopError) {
          console.warn('Could not stop camera recording during force cleanup:', stopError.message);
        }
      }
      
      console.log('✅ Recording state cleaned up successfully');
      return true;
    } catch (error) {
      console.error('Error during force cleanup:', error);
      // Ensure state is reset even if cleanup fails
      this.isRecording = false;
      this.currentRecordingPromise = null;
      return false;
    }
  }

  // New method for silent background media capture using expo-av
  async captureSilentMedia(type = 'photo', options = {}) {
    try {
      console.log(`🤫 Starting silent ${type} capture for security purposes...`);
      
      if (type === 'photo') {
        // Use ImagePicker for silent photo capture
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          throw new Error('Camera permission required for silent capture');
        }
        
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: options.quality || 0.6,
          allowsEditing: false,
          allowsMultipleSelection: false,
        });
        
        if (result.canceled || !result.assets || result.assets.length === 0) {
          throw new Error('Silent photo capture failed');
        }
        
        const media = { uri: result.assets[0].uri, type: 'photo' };
        
        // Save to media library silently
        if (media.uri) {
          await MediaLibrary.createAssetAsync(media.uri);
          console.log('🤫 Silent photo saved to gallery');
        }
        
        return media;
        
      } else if (type === 'video') {
        // Use ImagePicker for silent video capture
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          throw new Error('Camera permission required for silent video capture');
        }
        
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: ImagePicker.UIImagePickerControllerQualityType.Low,
          allowsEditing: false,
          videoMaxDuration: options.duration || 10,
          videoQuality: ImagePicker.UIImagePickerControllerQualityType.Low,
        });
        
        if (result.canceled || !result.assets || result.assets.length === 0) {
          throw new Error('Silent video capture failed');
        }
        
        const media = { uri: result.assets[0].uri, type: 'video' };
        
        // Save to media library silently
        if (media.uri) {
          await MediaLibrary.createAssetAsync(media.uri);
          console.log('🤫 Silent video saved to gallery');
        }
        
        return media;
      }
      
      throw new Error('Unsupported media type for silent capture');
      
    } catch (error) {
      console.error(`❌ Failed to capture silent ${type}:`, error);
      throw error;
    }
  }

  // True silent background capture methods (no UI interaction required)
  async captureSilentBackgroundPhoto() {
    try {
      console.log('📸 Attempting true silent background photo capture...');
      
      // For true silent capture, we need a camera ref or we cannot capture
      // Background capture without user interaction requires the camera to be already active
      if (!this.cameraRef) {
        throw new Error('Silent background capture requires active camera reference. Camera must be initialized first.');
      }
      
      // Use the existing camera ref to capture silently
      const photo = await this.cameraRef.takePictureAsync({
        quality: 0.6,
        base64: false,
        skipProcessing: true, // Skip processing for faster capture
      });
      
      if (!photo || !photo.uri) {
        throw new Error('Silent background photo capture failed - no image data returned.');
      }
      
      console.log('✅ Silent background photo captured:', photo.uri);
      return { uri: photo.uri, type: 'photo' };
      
    } catch (error) {
      console.error('❌ Failed to capture silent background photo:', error);
      throw error;
    }
  }

  async captureSilentBackgroundVideo(duration = 10) {
    try {
      console.log(`🎥 Attempting true silent background video capture for ${duration} seconds...`);
      
      // For true silent capture, we need a camera ref or we cannot capture
      if (!this.cameraRef) {
        throw new Error('Silent background video capture requires active camera reference. Camera must be initialized first.');
      }
      
      if (this.isRecording) {
        console.warn('⚠️ Already recording, attempting to clean up first...');
        try {
          // Force cleanup instead of trying to stop normally
          this.forceStopRecording();
        } catch (stopError) {
          console.warn('Failed to cleanup existing recording:', stopError.message);
        }
        // Wait a moment for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Use the existing camera ref to record silently
      const recordingOptions = {
        quality: '480p',
        maxDuration: duration,
        mute: true, // Always mute for silent background capture
      };
      
      console.log('🔇 Starting silent background video recording...');
      
      try {
        const recordingPromise = this.cameraRef.recordAsync(recordingOptions);
        this.isRecording = true;
        this.currentRecordingPromise = recordingPromise;
        
        // Auto-stop after duration
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              if (!this.isRecording || !this.currentRecordingPromise) {
                throw new Error('Recording was already stopped or not active');
              }
              
              this.isRecording = false;
              this.cameraRef.stopRecording();
              const video = await this.currentRecordingPromise;
              this.currentRecordingPromise = null;
              
              if (!video || !video.uri) {
                throw new Error('Silent background video capture failed - no video data returned.');
              }
              
              console.log('✅ Silent background video captured:', video.uri);
              resolve({ uri: video.uri, type: 'video' });
              
            } catch (error) {
              console.error('Failed to complete silent background video capture:', error);
              this.isRecording = false;
              this.currentRecordingPromise = null;
              reject(error);
            }
          }, duration * 1000);
        });
        
      } catch (recordError) {
        this.isRecording = false;
        this.currentRecordingPromise = null;
        
        if (recordError.message.includes('RECORD_AUDIO')) {
          throw new Error('Video recording failed due to missing audio permission. Please grant microphone permission in device settings or use photo capture instead.');
        } else if (recordError.message.includes('CAMERA')) {
          throw new Error('Video recording failed due to missing camera permission. Please grant camera permission in device settings.');
        } else {
          throw new Error(`Video recording failed: ${recordError.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to capture silent background video:', error);
      this.isRecording = false;
      this.currentRecordingPromise = null;
      throw error;
    }
  }

  // **** ALARM METHODS (SOUND ONLY) ****

  async loadAlarmSound() {
    try {
      if (this.beepSoundObject) {
        await this.beepSoundObject.unloadAsync();
        this.beepSoundObject = null;
      }
      
      console.log('🔊 Loading alarm sound...');
      this.beepSoundObject = new Audio.Sound();
      
      // Try to use a simple online beep sound first
      try {
        await this.beepSoundObject.loadAsync(
          { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }, 
          { shouldPlay: false }
        );
        console.log('🔊 Online alarm sound loaded successfully.');
        return;
      } catch (onlineError) {
        console.warn('⚠️ Online sound failed, trying data URI...', onlineError.message);
      }
      
      // Fallback to data URI beep sound
      const beepSoundUri = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmESANL98NJuKwAd';
      
      await this.beepSoundObject.loadAsync({ uri: beepSoundUri }, { shouldPlay: false });
      console.log('🔊 Data URI alarm sound loaded successfully.');
      
    } catch (error) {
      console.error('❌ All alarm sound loading methods failed:', error);
      this.beepSoundObject = null;
    }
  }

  async playBeepSound() {
    try {
      if (!this.beepSoundObject) {
        console.warn('⚠️ Alarm sound object not loaded. Attempting to reload...');
        await this.loadAlarmSound();
        if (!this.beepSoundObject) {
          console.error('❌ Alarm sound object still not available after reload attempt.');
          return;
        }
      }
      
      // Stop if already playing and reset position
      await this.beepSoundObject.stopAsync();
      await this.beepSoundObject.setPositionAsync(0);
      
      // Set volume to maximum for alarm
      await this.beepSoundObject.setVolumeAsync(1.0);
      
      // Play the sound
      await this.beepSoundObject.playAsync();
      console.log('🔊 Beep sound played via expo-av at maximum volume.');
    } catch (error) {
      console.error('❌ Failed to play beep sound via expo-av:', error);
      
      // If sound fails, provide a visual alert as last resort
      Alert.alert(
        '🚨 SECURITY ALARM 🚨',
        'Audio alarm failed - Please check device volume and unmute if necessary!',
        [{ text: 'OK' }]
      );
    }
  }

  async startAudioAlarm(duration = 30) {
    try {
      if (this.isAlarmPlaying) {
        await this.stopAudioAlarm();
      }

      console.log('🔊 Starting audio alarm (sound only)...');
      this.isAlarmPlaying = true;

      // Set audio mode for loud, background playback, bypassing silent mode on iOS
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true, // Crucial for iOS to play in silent mode
        staysActiveInBackground: true, // Keep audio active when app is in background
        shouldDuckAndroid: false, // Don't reduce volume when other apps play sound
        playThroughEarpieceAndroid: false, // Ensure sound plays through speaker
        allowsRecordingIOS: false, // We don't need recording for alarm
      });
      console.log('🎧 Audio mode configured for alarm.');

      // Ensure the sound is loaded before starting the pattern
      if (!this.beepSoundObject) {
        console.log('🔊 Loading alarm sound...');
        await this.loadAlarmSound();
      }

      if (!this.beepSoundObject) {
        throw new Error('Could not load alarm sound - sound object is null');
      }

      // Start the alarm pattern (playing sound)
      await this.playAlarmPattern();

      // Auto-stop after duration
      setTimeout(async () => {
        await this.stopAudioAlarm();
      }, duration * 1000);

      console.log(`🔊 Audio alarm started for ${duration} seconds (sound only).`);
      console.log('🔊 You should hear beeping sounds every 2 seconds if device is not muted.');

      return true;
    } catch (error) {
      console.error('❌ Failed to start audio alarm:', error);
      this.isAlarmPlaying = false;

      // Only show an alert if there was an actual error preventing the alarm from starting
      Alert.alert(
        '🚨 Alarm Activation Failed 🚨',
        `The security alarm could not be fully activated: ${error.message}\n\nPlease check:\n- Device is not muted\n- Volume is turned up\n- App has audio permissions`,
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
  }

  async playAlarmPattern() {
    if (!this.isAlarmPlaying) return;

    // Play the immediate beep sound
    await this.playBeepSound();

    // Create repeating alarm pattern
    this.alarmInterval = setInterval(async () => {
      if (!this.isAlarmPlaying) {
        // If alarm was stopped while interval was pending
        if (this.alarmInterval) {
          clearInterval(this.alarmInterval);
          this.alarmInterval = null;
        }
        return;
      }

      try {
        await this.playBeepSound(); // Play sound repeatedly
        console.log(`🔊 Repeating alarm beep.`);
      } catch (error) {
        console.error('Error in alarm pattern (playing beep):', error);
      }
    }, 2000); // Beep every 2 seconds
  }

  // The previous scheduleAlarmBeep method is entirely removed as it relied on Notifications.

  async stopAudioAlarm() {
    try {
      console.log('🔇 Stopping audio alarm...');
      this.isAlarmPlaying = false;

      // Stop alarm interval
      if (this.alarmInterval) {
        clearInterval(this.alarmInterval);
        this.alarmInterval = null;
      }

      // Stop and unload the sound object
      if (this.beepSoundObject) {
        await this.beepSoundObject.stopAsync();
        await this.beepSoundObject.unloadAsync(); // Unload to free up resources
        this.beepSoundObject = null;
      }

      // Reset audio mode to default after alarm stops
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('🎧 Audio mode reset to default.');

      console.log('🔇 Audio alarm stopped.');

      // No alert or notification for stopping the alarm, as requested.
      return true;
    } catch (error) {
      console.error('❌ Failed to stop audio alarm:', error);
      return false;
    }
  }

  isAudioAlarmPlaying() {
    return this.isAlarmPlaying;
  }

  // Enhanced methods using expo-av capabilities
  getAvailableCaptureMethods() {
    return {
      cameraRef: !!this.cameraRef,
      videoRef: !!this.videoRef,
      imagePicker: true, // Available but requires user interaction
      silentBackgroundCapture: !!this.cameraRef, // Only available when camera is active
      permissions: this.hasPermissions,
      supportedFeatures: {
        silentCapture: true,
        backgroundCapture: !!this.cameraRef,
        audioAlarm: true,
        videoRecording: !!this.cameraRef, // Requires camera ref and may need audio permission
        photoCapture: true,
        trueSilentCapture: !!this.cameraRef, // No user interaction required
        photoFallbackForVideo: true // Can fallback to photo if video fails
      }
    };
  }

  // Check if video recording is likely to work (this is a best-effort check)
  async checkVideoRecordingSupport() {
    try {
      if (!this.cameraRef) {
        return { supported: false, reason: 'No camera reference available' };
      }
      
      // We can't easily check audio permissions without attempting to record
      // So we return true if camera ref is available
      return { supported: true, reason: 'Camera reference available' };
    } catch (error) {
      return { supported: false, reason: error.message };
    }
  }

  // Removed checkNotificationPermissions and requestNotificationPermissions as notifications are not used for alarm.
}

// Enhanced MediaCaptureService with expo-av integration
// Features:
// - Primary method: Camera ref for direct silent capture (no user interaction)
// - Fallback method: Silent background capture when camera is active
// - Dual capture approaches based on camera availability
// - Enhanced audio alarm with expo-av
// - Improved permission handling
// - True remote capture without user interaction
// - Better error handling and logging
//
// Remote Capture Behavior:
// 1. If camera ref available: Direct silent capture (preferred)
// 2. If camera ref not available: Requires camera to be initialized first
// 3. No user interaction required when camera is properly set up
export default new MediaCaptureService();