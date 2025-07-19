import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from './SocketService';

class MediaCaptureService {
  constructor() {
    this.cameraRef = null;
    this.isRecording = false;
    this.hasPermissions = false;
  }

  async initialize() {
    try {
      // Request camera permissions
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

      this.hasPermissions = 
        cameraPermission.status === 'granted' &&
        mediaLibraryPermission.status === 'granted';

      if (!this.hasPermissions) {
        console.warn('Media capture permissions not fully granted');
      }

      console.log('Media capture service initialized');
    } catch (error) {
      console.error('Failed to initialize media capture service:', error);
    }
  }

  setCameraRef(ref) {
    this.cameraRef = ref;
  }

  async capturePhoto(options = {}) {
    try {
      if (!this.cameraRef || !this.hasPermissions) {
        throw new Error('Camera not available or permissions missing');
      }

      const photo = await this.cameraRef.takePictureAsync({
        quality: options.quality || 0.8,
        base64: options.includeBase64 || false,
        skipProcessing: false,
      });

      // Save to device
      const asset = await MediaLibrary.createAssetAsync(photo.uri);
      
      // Upload to server
      await this.uploadMedia(photo.uri, 'photo', options.isRemote || false);

      console.log('Photo captured:', photo.uri);
      return photo;
    } catch (error) {
      console.error('Failed to capture photo:', error);
      throw error;
    }
  }

  async startVideoRecording(options = {}) {
    try {
      if (!this.cameraRef || !this.hasPermissions || this.isRecording) {
        throw new Error('Cannot start video recording');
      }

      const video = await this.cameraRef.recordAsync({
        quality: options.quality || '720p',
        maxDuration: options.maxDuration || 30, // 30 seconds default
        mute: true, // Always mute - no audio support
      });

      this.isRecording = true;
      console.log('Video recording started');
      return video;
    } catch (error) {
      console.error('Failed to start video recording:', error);
      throw error;
    }
  }

  async stopVideoRecording() {
    try {
      if (!this.cameraRef || !this.isRecording) {
        throw new Error('No active video recording');
      }

      this.cameraRef.stopRecording();
      this.isRecording = false;
      console.log('Video recording stopped');
    } catch (error) {
      console.error('Failed to stop video recording:', error);
      throw error;
    }
  }

  async captureRemotePhoto() {
    try {
      const photo = await this.capturePhoto({ 
        isRemote: true,
        quality: 0.7,
        includeBase64: false 
      });

      // Send notification to dashboard
      SocketService.emit('media-captured', {
        type: 'photo',
        uri: photo.uri,
        timestamp: Date.now(),
        isRemote: true,
      });

      return photo;
    } catch (error) {
      console.error('Failed to capture remote photo:', error);
      throw error;
    }
  }

  async captureRemoteVideo(duration = 15) {
    try {
      const video = await this.startVideoRecording({
        maxDuration: duration,
        quality: '480p',
        isRemote: true,
      });

      // Auto-stop after duration
      setTimeout(() => {
        this.stopVideoRecording();
      }, duration * 1000);

      // Save and upload
      const asset = await MediaLibrary.createAssetAsync(video.uri);
      await this.uploadMedia(video.uri, 'video', true);

      // Send notification to dashboard
      SocketService.emit('media-captured', {
        type: 'video',
        uri: video.uri,
        duration: duration,
        timestamp: Date.now(),
        isRemote: true,
      });

      console.log('Remote video captured:', video.uri);
      return video;
    } catch (error) {
      console.error('Failed to capture remote video:', error);
      throw error;
    }
  }

  async uploadMedia(uri, type, isRemote = false) {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: `capture_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
      });
      formData.append('type', type);
      formData.append('isRemote', isRemote.toString());
      formData.append('captureReason', isRemote ? 'remote_command' : 'manual');

      // Note: You'll need to implement the actual upload logic here
      // This is a placeholder for the upload functionality
      console.log('Media uploaded:', uri);
      
      await this.saveMediaToHistory({
        uri,
        type,
        isRemote,
        uploadedAt: Date.now()
      });

    } catch (error) {
      console.error('Failed to upload media:', error);
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

      // Keep only last 100 media items
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
}

export default new MediaCaptureService();
