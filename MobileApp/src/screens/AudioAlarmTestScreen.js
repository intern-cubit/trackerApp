import React from 'react';
import { View, Button, Text, StyleSheet, Alert } from 'react-native';
import MediaCaptureService from '../services/MediaCaptureService';

const AudioAlarmTestScreen = () => {
  const [alarmStatus, setAlarmStatus] = React.useState('stopped');

  const testLoadSound = async () => {
    try {
      console.log('🧪 Testing sound loading...');
      Alert.alert('Testing', 'Loading alarm sound from online sources...');
      
      const result = await MediaCaptureService.loadAlarmSound();
      if (result) {
        Alert.alert('✅ Success', 'Alarm sound loaded successfully from online source!');
      } else {
        Alert.alert('❌ Failed', 'Could not load alarm sound from any online source');
      }
    } catch (error) {
      Alert.alert('❌ Error', `Failed to load sound: ${error.message}`);
    }
  };

  const testBeepSound = async () => {
    try {
      console.log('🧪 Testing beep sound...');
      Alert.alert('Testing', 'Playing single beep sound...');
      
      const result = await MediaCaptureService.playBeepSound();
      if (result) {
        Alert.alert('✅ Success', 'Beep sound played successfully!');
      } else {
        Alert.alert('❌ Failed', 'Could not play beep sound');
      }
    } catch (error) {
      Alert.alert('❌ Error', `Failed to play beep: ${error.message}`);
    }
  };

  const testFullAlarm = async () => {
    try {
      console.log('🧪 Testing full audio alarm...');
      setAlarmStatus('starting');
      
      const result = await MediaCaptureService.startAudioAlarm(5); // 5 second test
      if (result) {
        setAlarmStatus('playing');
        Alert.alert('✅ Success', 'Audio alarm started! Should be playing for 5 seconds.');
        
        // Update status after 5 seconds
        setTimeout(() => {
          setAlarmStatus('stopped');
        }, 5000);
      } else {
        setAlarmStatus('stopped');
        Alert.alert('❌ Failed', 'Could not start audio alarm');
      }
    } catch (error) {
      setAlarmStatus('stopped');
      Alert.alert('❌ Error', `Failed to start alarm: ${error.message}`);
    }
  };

  const stopAlarm = async () => {
    try {
      console.log('🧪 Stopping audio alarm...');
      await MediaCaptureService.stopAudioAlarm();
      setAlarmStatus('stopped');
      Alert.alert('🔇 Stopped', 'Audio alarm stopped successfully');
    } catch (error) {
      Alert.alert('❌ Error', `Failed to stop alarm: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔊 Audio Alarm Test</Text>
      <Text style={styles.status}>Status: {alarmStatus}</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="1. Load Sound"
          onPress={testLoadSound}
          color="#007AFF"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="2. Test Beep"
          onPress={testBeepSound}
          color="#34C759"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="3. Test Full Alarm (5s)"
          onPress={testFullAlarm}
          disabled={alarmStatus === 'playing'}
          color="#FF9500"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="🔇 Stop Alarm"
          onPress={stopAlarm}
          disabled={alarmStatus !== 'playing'}
          color="#FF3B30"
        />
      </View>

      <Text style={styles.instructions}>
        Instructions:{'\n'}
        1. First load the sound from online sources{'\n'}
        2. Test single beep to verify audio works{'\n'}
        3. Test full alarm (will play for 5 seconds){'\n'}
        4. Use stop button if needed{'\n\n'}
        Note: Alarm should work even if device is on silent mode!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  status: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  instructions: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default AudioAlarmTestScreen;
