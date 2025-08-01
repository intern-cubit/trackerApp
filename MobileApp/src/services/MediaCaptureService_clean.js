import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from './SocketService';
import PermissionManager from './PermissionManager';
import { API_BASE_URL } from '../config/api';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

class MediaCaptureService {
  constructor() {
    this.cameraRef = null;
    this.isRecording = false;
    this.hasPermissions = false;
    this.currentRecordingPromise = null;
    this.isAlarmPlaying = false;
    this.alarmSoundObject = null;
    this.alarmInterval = null;
    
    // Multiple alarm sound URLs for reliability
    this.alarmSoundUrls = [
      'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
      'https://opengameart.org/sites/default/files/audio_preview/Randomize4.ogg.mp3',
      'https://www.orangefreesounds.com/wp-content/uploads/2022/02/Alarm-clock-short-sound.mp3',
      'https://freesound.org/data/previews/316/316847_5123451-lq.mp3',
      'https://www.soundboard.com/handler/DownLoadTrack.ashx?cliptitle=Air+Raid+Siren-SoundBible.com-1251946398.mp3'
    ];
  }

  async initialize() {
    try {
      console.log('🎥 Initializing MediaCaptureService...');

      // Request media library permissions
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      console.log('📋 Media Library permission status:', mediaLibraryPermission.status);

      // Request image picker permissions for fallback capture
      const imagePickerPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📸 Image Picker permission status:', imagePickerPermission.status);

      this.hasPermissions = mediaLibraryPermission.status === 'granted';

      if (!this.hasPermissions) {
        console.warn('⚠️ Some permissions not granted');
      } else {
        console.log('✅ All permissions granted for media capture');
      }

      // Pre-load the alarm sound
      await this.loadAlarmSound();

      console.log('🎥 Media capture service initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize media capture service:', error);
    }
  }

  // Load alarm sound from online sources
  async loadAlarmSound() {
    try {
      console.log('🔊 Loading alarm sound from online sources...');
      
      // Configure audio mode for alarms (bypass silent mode)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true, // KEY: This bypasses silent mode
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      // Try to load alarm sound from multiple sources
      for (const soundUrl of this.alarmSoundUrls) {
        try {
          console.log(`🔊 Attempting to load sound from: ${soundUrl}`);
          
          const { sound } = await Audio.Sound.createAsync(
            { uri: soundUrl },
            { 
              shouldPlay: false,
              isLooping: true,
              volume: 1.0
            }
          );
          
          if (sound) {
            this.alarmSoundObject = sound;
            console.log('✅ Alarm sound loaded successfully from:', soundUrl);
            return true;
          }
        } catch (urlError) {
          console.warn(`⚠️ Failed to load sound from ${soundUrl}:`, urlError.message);
          continue;
        }
      }
      
      console.warn('⚠️ Could not load alarm sound from any online source');
      return false;
      
    } catch (error) {
      console.error('❌ Failed to load alarm sound:', error);
      return false;
    }
  }

  // Play a beep sound for immediate feedback
  async playBeepSound() {
    try {
      if (!this.alarmSoundObject) {
        console.log('🔊 No alarm sound loaded, attempting to load...');
        await this.loadAlarmSound();
      }

      if (this.alarmSoundObject) {
        await this.alarmSoundObject.setPositionAsync(0); // Reset to beginning
        await this.alarmSoundObject.playAsync();
        console.log('🔊 Beep sound played successfully');
        return true;
      } else {
        console.warn('⚠️ No alarm sound available for beep');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to play beep sound:', error);
      return false;
    }
  }

  // Start continuous audio alarm
  async startAudioAlarm(duration = 10) {
    try {
      if (this.isAlarmPlaying) {
        console.log('🔊 Alarm already playing, stopping first...');
        await this.stopAudioAlarm();
      }

      console.log(`🚨 Starting audio alarm for ${duration} seconds...`);
      this.isAlarmPlaying = true;

      // Ensure sound is loaded
      if (!this.alarmSoundObject) {
        console.log('🔊 Loading alarm sound...');
        const loaded = await this.loadAlarmSound();
        if (!loaded) {
          throw new Error('Could not load alarm sound from any source');
        }
      }

      // Configure audio for alarm playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true, // Bypass silent mode
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      // Start playing the alarm sound
      await this.alarmSoundObject.setIsLoopingAsync(true);
      await this.alarmSoundObject.setVolumeAsync(1.0);
      await this.alarmSoundObject.playAsync();
      
      console.log('🔊 Audio alarm started successfully');

      // Show alert with stop option
      Alert.alert(
        '🚨 SECURITY ALARM ACTIVE 🚨',
        'Audio alarm is now playing! This alarm will bypass silent mode.',
        [
          {
            text: 'Stop Alarm',
            style: 'destructive',
            onPress: () => this.stopAudioAlarm()
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );

      // Auto-stop after duration
      setTimeout(async () => {
        if (this.isAlarmPlaying) {
          await this.stopAudioAlarm();
        }
      }, duration * 1000);

      console.log(`🚨 Audio alarm started for ${duration} seconds.`);
      return true;

    } catch (error) {
      console.error('❌ Failed to start audio alarm:', error);
      this.isAlarmPlaying = false;
      
      // Fallback alert
      Alert.alert(
        '🚨 SECURITY ALERT 🚨',
        'Audio alarm failed to start, but security event detected! Please check device.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  // Stop audio alarm
  async stopAudioAlarm() {
    try {
      console.log('🔇 Stopping audio alarm...');
      this.isAlarmPlaying = false;

      if (this.alarmSoundObject) {
        await this.alarmSoundObject.stopAsync();
        await this.alarmSoundObject.setPositionAsync(0);
        console.log('🔇 Audio alarm sound stopped');
      }

      // Clear any intervals
      if (this.alarmInterval) {
        clearInterval(this.alarmInterval);
        this.alarmInterval = null;
      }

      console.log('🔇 Audio alarm stopped successfully.');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to stop audio alarm:', error);
      this.isAlarmPlaying = false;
      return false;
    }
  }

  isAudioAlarmPlaying() {
    return this.isAlarmPlaying;
  }

  setCameraRef(ref) {
    this.cameraRef = ref;
    console.log('📷 Camera reference set:', !!ref);
  }

  async capturePhoto(options = {}) {
    try {
      if (!this.cameraRef) {
        throw new Error('Camera reference not available. Ensure camera component is mounted and active.');
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
        maxDuration: options.maxDuration || 30,
        mute: true, // Always mute to avoid permission issues
      };

      console.log('🔇 Starting muted video recording to avoid audio permission issues');
      
      try {
        const recordingPromise = this.cameraRef.recordAsync(recordingOptions);
        this.isRecording = true;
        this.currentRecordingPromise = recordingPromise;
        console.log('✅ Video recording started (audio muted).');
        return { status: 'recording_started', audioMuted: true };
      } catch (recordError) {
        console.error('Failed to start video recording:', recordError);
        this.isRecording = false;
        this.currentRecordingPromise = null;
        
        if (recordError.message.includes('RECORD_AUDIO')) {
          throw new Error('Cannot start video recording: Audio permission required.');
        } else if (recordError.message.includes('CAMERA')) {
          throw new Error('Cannot start video recording: Missing camera permission.');
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
      
      if (!this.isRecording || !this.currentRecordingPromise) {
        throw new Error('No active video recording to stop.');
      }

      this.cameraRef.stopRecording();
      const video = await this.currentRecordingPromise;
      
      this.isRecording = false;
      this.currentRecordingPromise = null;

      if (!video || !video.uri) {
        throw new Error('Failed to stop video recording - no video data returned.');
      }

      console.log('✅ Video recorded:', video.uri);
      const asset = await MediaLibrary.createAssetAsync(video.uri);
      console.log('📱 Video saved to gallery');

      try {
        await this.uploadMedia(video.uri, 'video', false);
        console.log('☁️ Video uploaded to server successfully');
      } catch (uploadError) {
        console.warn('⚠️ Video upload failed, but video was saved locally:', uploadError.message);
      }

      console.log('🎥 Video recording completed successfully');
      return video;
    } catch (error) {
      console.error('❌ Failed to stop video recording:', error);
      this.isRecording = false;
      this.currentRecordingPromise = null;
      throw error;
    }
  }

  async captureWithImagePicker(mediaType = 'photo') {
    try {
      console.log(`📷 Opening image picker for ${mediaType}...`);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        throw new Error('Image picker permissions not granted');
      }

      const options = {
        mediaTypes: mediaType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 30,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        throw new Error('Image picker was cancelled or no media selected');
      }

      const asset = result.assets[0];
      console.log(`✅ Media selected from gallery: ${asset.uri}`);

      try {
        await this.uploadMedia(asset.uri, mediaType, false);
        console.log('☁️ Media uploaded to server successfully');
      } catch (uploadError) {
        console.warn('⚠️ Media upload failed:', uploadError.message);
      }

      return asset;
    } catch (error) {
      console.error('❌ Failed to capture with image picker:', error);
      throw error;
    }
  }

  async uploadMedia(uri, type, isRemote = false) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log(`☁️ Uploading ${type} to server...`);
      
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: `${type}_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
      });
      formData.append('type', type);
      formData.append('isRemote', isRemote.toString());

      const response = await fetch(`${API_BASE_URL}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ ${type} uploaded successfully:`, result.fileUrl);

      // Emit to socket for real-time updates
      if (SocketService.isConnected()) {
        SocketService.emit('media_captured', {
          type,
          url: result.fileUrl,
          timestamp: new Date().toISOString(),
          isRemote
        });
      }

      return result;
    } catch (error) {
      console.error(`❌ Failed to upload ${type}:`, error);
      throw error;
    }
  }

  getAvailableCaptureMethods() {
    return {
      cameraRef: !!this.cameraRef,
      imagePicker: true,
      silentBackgroundCapture: !!this.cameraRef,
      permissions: this.hasPermissions,
      supportedFeatures: {
        silentCapture: true,
        backgroundCapture: !!this.cameraRef,
        audioAlarm: true,
        videoRecording: !!this.cameraRef,
        photoCapture: true,
        trueSilentCapture: !!this.cameraRef,
        photoFallbackForVideo: true
      }
    };
  }

  async checkVideoRecordingSupport() {
    try {
      if (!this.cameraRef) {
        return { supported: false, reason: 'No camera reference available' };
      }
      
      return { supported: true, reason: 'Camera reference available' };
    } catch (error) {
      return { supported: false, reason: error.message };
    }
  }
}

export default new MediaCaptureService();
