import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from './SocketService';
import { API_BASE_URL } from '../config/api';

class MediaCaptureService {
  constructor() {
    this.cameraRef = null;
    this.isRecording = false;
    this.hasPermissions = false; // This will now mainly reflect MediaLibrary and Camera (via ref presence)
    this.currentRecordingPromise = null;
  }

  async initialize() {
    try {
      console.log('🎥 Initializing MediaCaptureService...');

      // Request media library permissions only
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      console.log('📋 Media Library permission status:', mediaLibraryPermission.status);

      // Camera permissions are handled by MediaScreen's useCameraPermissions hook.
      // Audio permissions will be handled by the fallback service

      this.hasPermissions = mediaLibraryPermission.status === 'granted';

      if (!this.hasPermissions) {
        console.warn('⚠️ Media library permission not granted');
        console.log('Media library permission:', mediaLibraryPermission.status);
      } else {
        console.log('✅ Media library permission granted');
      }

      console.log('🎥 Media capture service initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize media capture service:', error);
      // Do not re-throw here, as initialization shouldn't crash the app
    }
  }

  // This method will now only check MediaLibrary permissions.
  // Camera permissions are checked by useCameraPermissions in the component.
  // Audio permissions are expected to be declared in app.json for Android
  // and implicitly requested by the system when recordAsync is called.
  async checkAndRequestPermissions() {
    try {
      console.log('📋 Checking media library permissions...');

      // Check media library permissions
      const mediaLibraryPermission = await MediaLibrary.getPermissionsAsync();

      let mediaLibraryGranted = true;
      if (mediaLibraryPermission.status !== 'granted') {
        const result = await MediaLibrary.requestPermissionsAsync();
        mediaLibraryGranted = result.status === 'granted';
      }

      this.hasPermissions = mediaLibraryGranted; // Only reflect media library for this service's internal state

      console.log('📋 Media library permissions check result:', this.hasPermissions);
      return this.hasPermissions; // Returns true if media library is granted
    } catch (error) {
      console.error('Error checking media library permissions:', error);
      return false;
    }
  }

  setCameraRef(ref) {
    this.cameraRef = ref;
    if (ref) {
      console.log('📸 Camera reference set.');
      // When the ref is set, it implies the camera component itself has
      // successfully acquired camera permissions.
    }
  }

  async capturePhoto(options = {}) {
    try {
      if (!this.cameraRef) {
        throw new Error('Camera reference not available. Ensure camera is open and permissions granted.');
      }

      // Re-check MediaLibrary permission specifically for saving photos
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

      // Save to device
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      console.log('📱 Photo saved to gallery');

      // Try to upload to server, but don't fail if upload fails
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

      // Re-check MediaLibrary permission specifically for saving videos
      const mediaLibraryPermission = await MediaLibrary.getPermissionsAsync();
      if (mediaLibraryPermission.status !== 'granted') {
        const result = await MediaLibrary.requestPermissionsAsync();
        if (result.status !== 'granted') {
          throw new Error('Media library permissions not granted. Cannot save video.');
        }
      }

      console.log('� Starting video recording...');

      // Always use muted recording to avoid audio permission issues
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
        
        // Reset state on failure
        this.isRecording = false;
        this.currentRecordingPromise = null;
        
        // Provide more specific error messages
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
      this.isRecording = false; // Ensure recording state is reset on failure
      throw error;
    }
  }

  async stopVideoRecording() {
    try {
      if (!this.cameraRef) {
        console.warn('⚠️ Camera reference not available');
        throw new Error('Camera reference not available.');
      }
      
      if (!this.isRecording || !this.currentRecordingPromise) {
        console.warn('⚠️ No active video recording to stop');
        // Reset state to ensure consistency
        this.isRecording = false;
        this.currentRecordingPromise = null;
        throw new Error('No active video recording to stop.');
      }

      console.log('🛑 Stopping video recording...');

      try {
        // Stop the recording and immediately mark as not recording
        this.isRecording = false;
        this.cameraRef.stopRecording();

        // Wait for the recording promise to resolve
        const video = await this.currentRecordingPromise;
        this.currentRecordingPromise = null;
        
        if (!video || !video.uri) {
          throw new Error('Video recording failed - no video data returned.');
        }

        console.log('✅ Video recording completed:', video.uri);

        // Save to device
        const asset = await MediaLibrary.createAssetAsync(video.uri);
        console.log('📱 Video saved to gallery');

        // Try to upload to server, but don't fail if upload fails
        try {
          await this.uploadMedia(video.uri, 'video', true);
          console.log('☁️ Video uploaded to server');
        } catch (uploadError) {
          console.warn('⚠️ Video upload failed:', uploadError.message);
        }

        console.log('🎥 Video recording process completed successfully');
        return video;
      } catch (recordingError) {
        // If there's an error in the recording promise, clean up state
        console.error('Error during video recording stop:', recordingError);
        this.isRecording = false;
        this.currentRecordingPromise = null;
        
        // Check if it's a permission error
        if (recordingError.message && recordingError.message.includes('RECORD_AUDIO')) {
          throw new Error('Video recording failed due to missing audio permission. Recording was muted but system still requires audio permission.');
        }
        
        throw recordingError;
      }
    } catch (error) {
      console.error('Failed to stop video recording:', error);
      
      // Ensure state is reset even on error
      this.isRecording = false;
      this.currentRecordingPromise = null;
      
      throw error;
    }
  }

  async captureRemotePhoto() {
    try {
      console.log('📸 Starting remote photo capture...');
      console.log('📋 Camera ref available:', !!this.cameraRef);

      const photo = await this.capturePhoto({
        isRemote: true,
        quality: 0.7,
        includeBase64: false
      });

      if (!photo || !photo.uri) {
        throw new Error('Photo capture returned empty result.');
      }

      console.log('✅ Remote photo captured successfully:', photo.uri);

      SocketService.emit('media-captured', {
        type: 'photo',
        uri: photo.uri,
        timestamp: Date.now(),
        isRemote: true,
      });

      return photo;
    } catch (error) {
      console.error('❌ Failed to capture remote photo:', error);
      throw error;
    }
  }

  async captureRemoteVideo(duration = 15) {
    try {
      const result = await this.startVideoRecording({
        maxDuration: duration,
        quality: '480p',
        isRemote: true,
        forceNoAudio: true, // Explicitly force no audio for remote video
      });

      if (result.audioMuted) {
        console.log('🔇 Remote video recording started without audio (intentional for remote capture)');
      }

      console.log(`🎥 Video recording started for ${duration} seconds...`);

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
              audioMuted: result.audioMuted || true
            });

            console.log('✅ Remote video capture completed.');
            resolve({ duration, timestamp: Date.now(), audioMuted: result.audioMuted || true });
          } catch (error) {
            console.error('Failed to complete remote video capture (during stop):', error);
            reject(error);
          }
        }, duration * 1000);
      });
    } catch (error) {
      console.error('Failed to capture remote video (during start):', error);
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
    // This method is less meaningful now without direct audio permission check here.
    // It will reflect MediaLibrary permissions. Camera permissions are checked in MediaScreen.
    return this.hasPermissions;
  }
}

export default new MediaCaptureService();