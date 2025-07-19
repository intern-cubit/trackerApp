import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import SocketService from './SocketService';
import { API_BASE_URL } from '../config/api';

class MediaCaptureServiceFallback {
  constructor() {
    this.cameraRef = null;
    this.isRecording = false;
    this.hasPermissions = false;
    this.currentRecordingPromise = null;
    this.recordingStartTime = null;
    this.recordingTimer = null;
  }

  async initialize() {
    try {
      console.log('🎥 Initializing MediaCaptureServiceFallback...');

      // Only request media library permissions
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      console.log('📋 Media Library permission status:', mediaLibraryPermission.status);

      this.hasPermissions = mediaLibraryPermission.status === 'granted';

      if (!this.hasPermissions) {
        console.warn('⚠️ Media library permission not granted');
      } else {
        console.log('✅ Media library permission granted');
      }

      console.log('🎥 Fallback media capture service initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize fallback media capture service:', error);
    }
  }

  setCameraRef(ref) {
    this.cameraRef = ref;
    if (ref) {
      console.log('📸 Camera reference set in fallback service.');
    }
  }

  async capturePhoto(options = {}) {
    try {
      if (!this.cameraRef) {
        throw new Error('Camera reference not available. Ensure camera is open and permissions granted.');
      }

      console.log('📸 Taking picture with fallback service...');
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
      if (this.hasPermissions) {
        const asset = await MediaLibrary.createAssetAsync(photo.uri);
        console.log('📱 Photo saved to gallery');
      }

      // Try to upload to server
      try {
        await this.uploadMedia(photo.uri, 'photo', options.isRemote || false);
        console.log('☁️ Photo uploaded to server successfully');
      } catch (uploadError) {
        console.warn('⚠️ Photo upload failed:', uploadError.message);
      }

      return photo;
    } catch (error) {
      console.error('❌ Failed to capture photo:', error);
      throw error;
    }
  }

  async startVideoRecordingNoAudio(options = {}) {
    try {
      if (!this.cameraRef || this.isRecording) {
        throw new Error('Cannot start video recording: Camera reference not available or already recording.');
      }

      console.log('🎥 Starting video recording without audio (fallback method)...');

      // Try recording with mute parameter first
      try {
        const recordingPromise = this.cameraRef.recordAsync({
          quality: '480p',
          maxDuration: options.maxDuration || 30,
          mute: true, // Try with mute first
        });

        this.isRecording = true;
        this.currentRecordingPromise = recordingPromise;
        this.recordingStartTime = Date.now();
        
        console.log('✅ Video recording started (fallback method with mute).');
        return { status: 'recording_started', audioMuted: true };
      } catch (muteError) {
        console.warn('⚠️ Recording with mute failed, trying without audio params:', muteError.message);
        
        // If mute fails, try without any audio parameters
        const recordingPromise = this.cameraRef.recordAsync({
          quality: '480p',
          maxDuration: options.maxDuration || 30,
          // No audio parameters at all
        });

        this.isRecording = true;
        this.currentRecordingPromise = recordingPromise;
        this.recordingStartTime = Date.now();
        
        console.log('✅ Video recording started (fallback method without audio params).');
        return { status: 'recording_started', audioMuted: false }; // May have audio
      }
    } catch (error) {
      console.error('Failed to start video recording (fallback):', error);
      this.isRecording = false;
      this.currentRecordingPromise = null;
      
      // Provide helpful error message
      if (error.message.includes('RECORD_AUDIO')) {
        throw new Error('Video recording requires audio permission. Please grant microphone permission in device settings.');
      }
      
      throw error;
    }
  }

  async stopVideoRecordingNoAudio() {
    try {
      if (!this.cameraRef) {
        throw new Error('Camera reference not available.');
      }
      
      if (!this.isRecording || !this.currentRecordingPromise) {
        console.warn('⚠️ No active video recording to stop');
        this.isRecording = false;
        this.currentRecordingPromise = null;
        throw new Error('No active video recording to stop.');
      }

      console.log('🛑 Stopping video recording (fallback method)...');

      // Stop recording
      this.cameraRef.stopRecording();
      this.isRecording = false;

      // Wait for recording to complete
      const video = await this.currentRecordingPromise;
      this.currentRecordingPromise = null;
      this.recordingStartTime = null;
      
      if (!video || !video.uri) {
        throw new Error('Video recording failed - no video data returned.');
      }

      console.log('✅ Video recording completed:', video.uri);

      // Save to device
      if (this.hasPermissions) {
        const asset = await MediaLibrary.createAssetAsync(video.uri);
        console.log('📱 Video saved to gallery');
      }

      // Try to upload to server
      try {
        await this.uploadMedia(video.uri, 'video', true);
        console.log('☁️ Video uploaded to server');
      } catch (uploadError) {
        console.warn('⚠️ Video upload failed:', uploadError.message);
      }

      return video;
    } catch (error) {
      console.error('Failed to stop video recording (fallback):', error);
      this.isRecording = false;
      this.currentRecordingPromise = null;
      this.recordingStartTime = null;
      throw error;
    }
  }

  async captureRemoteVideoNoAudio(duration = 15) {
    try {
      await this.startVideoRecordingNoAudio({
        maxDuration: duration,
        quality: '480p',
        isRemote: true,
      });

      console.log(`🎥 Video recording started for ${duration} seconds (no audio)...`);

      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          try {
            await this.stopVideoRecordingNoAudio();

            console.log('🎥 Remote video recording completed (no audio).');

            SocketService.emit('media-captured', {
              type: 'video',
              duration: duration,
              timestamp: Date.now(),
              isRemote: true,
              status: 'completed',
              audioMuted: true
            });

            resolve({ duration, timestamp: Date.now(), audioMuted: true });
          } catch (error) {
            console.error('Failed to complete remote video capture (fallback):', error);
            reject(error);
          }
        }, duration * 1000);
      });
    } catch (error) {
      console.error('Failed to capture remote video (fallback):', error);
      throw error;
    }
  }

  async uploadMedia(uri, type, isRemote = false) {
    try {
      console.log('📤 Starting media upload (fallback)...', { uri, type, isRemote });

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: type === 'photo' ? 'image/jpeg' : 'video/mp4',
        name: `${type}_${Date.now()}.${type === 'photo' ? 'jpg' : 'mp4'}`,
      });

      formData.append('type', type);
      formData.append('isRemote', isRemote.toString());
      formData.append('timestamp', Date.now().toString());

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Media uploaded successfully (fallback):', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to upload media (fallback):', error);
      throw error;
    }
  }

  // Helper method to check if video recording is active
  isVideoRecording() {
    return this.isRecording;
  }
}

export default new MediaCaptureServiceFallback();
