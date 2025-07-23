import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from './SocketService';
import { API_BASE_URL } from '../config/api';
import { Alert, Platform } from 'react-native';
// import * as Notifications from 'expo-notifications'; // <--- REMOVED
import { Audio } from 'expo-av'; // Keep Audio from expo-av

class MediaCaptureService {
  constructor() {
    this.cameraRef = null;
    this.isRecording = false;
    this.hasPermissions = false;
    this.currentRecordingPromise = null;
    this.isAlarmPlaying = false;
    this.alarmInterval = null;
    this.beepSoundObject = null; // To hold the loaded sound object for expo-av
  }

  async initialize() {
    try {
      console.log('🎥 Initializing MediaCaptureService...');

      // Request media library permissions only
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      console.log('📋 Media Library permission status:', mediaLibraryPermission.status);

      this.hasPermissions = mediaLibraryPermission.status === 'granted';

      if (!this.hasPermissions) {
        console.warn('⚠️ Media library permission not granted');
      } else {
        console.log('✅ Media library permission granted');
      }

      // Pre-load the alarm sound for expo-av
      await this.loadAlarmSound();

      console.log('🎥 Media capture service initialized.');
    } catch (error) {
      console.error('❌ Failed to initialize media capture service:', error);
    }
  }

  // This method will now only check MediaLibrary permissions.
  async checkAndRequestPermissions() {
    try {
      console.log('📋 Checking media library permissions...');
      const mediaLibraryPermission = await MediaLibrary.getPermissionsAsync();
      let mediaLibraryGranted = true;
      if (mediaLibraryPermission.status !== 'granted') {
        const result = await MediaLibrary.requestPermissionsAsync();
        mediaLibraryGranted = result.status === 'granted';
      }
      this.hasPermissions = mediaLibraryGranted;
      console.log('📋 Media library permissions check result:', this.hasPermissions);
      return this.hasPermissions;
    } catch (error) {
      console.error('Error checking media library permissions:', error);
      return false;
    }
  }

  setCameraRef(ref) {
    this.cameraRef = ref;
    if (ref) {
      console.log('📸 Camera reference set.');
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
      if (!this.cameraRef) {
        console.warn('⚠️ Camera reference not available');
        throw new Error('Camera reference not available.');
      }
      if (!this.isRecording || !this.currentRecordingPromise) {
        console.warn('⚠️ No active video recording to stop');
        this.isRecording = false;
        this.currentRecordingPromise = null;
        throw new Error('No active video recording to stop.');
      }
      console.log('🛑 Stopping video recording...');
      try {
        this.isRecording = false;
        this.cameraRef.stopRecording();
        const video = await this.currentRecordingPromise;
        this.currentRecordingPromise = null;
        if (!video || !video.uri) {
          throw new Error('Video recording failed - no video data returned.');
        }
        console.log('✅ Video recording completed:', video.uri);
        const asset = await MediaLibrary.createAssetAsync(video.uri);
        console.log('📱 Video saved to gallery');
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
        if (recordingError.message && recordingError.message.includes('RECORD_AUDIO')) {
          throw new Error('Video recording failed due to missing audio permission. Recording was muted but system still requires audio permission.');
        }
        throw recordingError;
      }
    } catch (error) {
      console.error('Failed to stop video recording:', error);
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
        forceNoAudio: true,
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
    return this.hasPermissions;
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

  // Removed checkNotificationPermissions and requestNotificationPermissions as notifications are not used for alarm.
}

export default new MediaCaptureService();