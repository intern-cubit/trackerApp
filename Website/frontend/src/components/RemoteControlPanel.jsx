import React, { useState, useEffect } from 'react';
import { Camera, Video, StopCircle, Wifi, WifiOff, Clock, CheckCircle, XCircle } from 'lucide-react';
import io from 'socket.io-client';

const RemoteControlPanel = ({ selectedDevice, isVisible, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [commandStatus, setCommandStatus] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(15);

  useEffect(() => {
    if (isVisible && selectedDevice) {
      initializeSocket();
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isVisible, selectedDevice]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000", {
      auth: { 
        token,
        type: 'web'
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Remote control socket connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Remote control socket disconnected');
    });

    newSocket.on('command-sent', (data) => {
      setCommandStatus({
        type: 'sent',
        message: `Command sent to device`,
        commandType: data.commandType,
        timestamp: Date.now()
      });
    });

    newSocket.on('command-error', (data) => {
      setCommandStatus({
        type: 'error',
        message: data.error,
        commandType: data.commandType,
        timestamp: Date.now()
      });
    });

    newSocket.on('command-status-update', (data) => {
      setCommandStatus({
        type: data.status,
        message: getStatusMessage(data.status, data.commandType),
        commandType: data.commandType,
        response: data.response,
        error: data.error,
        timestamp: Date.now()
      });
      
      if (data.commandType === 'stop-video') {
        setIsRecording(false);
      }
    });

    newSocket.on('media-notification', (data) => {
      setCommandStatus({
        type: 'completed',
        message: `${data.media.type} captured successfully!`,
        commandType: `capture-${data.media.type}`,
        timestamp: Date.now()
      });
      
      if (data.media.type === 'video') {
        setIsRecording(false);
      }
    });

    setSocket(newSocket);
  };

  const getStatusMessage = (status, commandType) => {
    const action = commandType === 'capture-photo' ? 'Photo capture' : 'Video recording';
    
    switch (status) {
      case 'received':
        return `${action} command received by device`;
      case 'completed':
        return `${action} completed successfully`;
      case 'failed':
        return `${action} failed`;
      default:
        return `${action} status: ${status}`;
    }
  };

  const sendRemoteCommand = (commandType, options = {}) => {
    if (!socket || !isConnected || !selectedDevice) {
      setCommandStatus({
        type: 'error',
        message: 'Not connected to device',
        commandType,
        timestamp: Date.now()
      });
      return;
    }

    setCommandStatus({
      type: 'sending',
      message: 'Sending command...',
      commandType,
      timestamp: Date.now()
    });

    socket.emit('remote-capture-command', {
      deviceId: selectedDevice.tracker._id,
      commandType,
      options
    });
  };

  const capturePhoto = () => {
    sendRemoteCommand('capture-photo', {
      quality: 0.8,
      includeBase64: false
    });
  };

  const startVideoRecording = () => {
    if (isRecording) {
      stopVideoRecording();
      return;
    }
    
    setIsRecording(true);
    sendRemoteCommand('start-video', {
      duration: recordingDuration,
      quality: '720p'
    });
  };

  const stopVideoRecording = () => {
    setIsRecording(false);
    sendRemoteCommand('stop-video');
  };

  const getStatusIcon = () => {
    if (!commandStatus) return null;
    
    switch (commandStatus.type) {
      case 'sending':
      case 'sent':
      case 'received':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-w-[90vw] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Remote Media Control
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Device Info */}
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Device: {selectedDevice?.tracker?.vehicleType || 'Unknown'}
            </span>
            <div className="flex items-center">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Device Connected' : 'Device Disconnected'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Location Sharing: {selectedDevice?.status || 'Unknown'}
            {!isConnected && (
              <span className="block text-amber-600 dark:text-amber-400 mt-1">
                ⚠️ Device app must be running and connected
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* Photo Capture */}
          <button
            onClick={capturePhoto}
            disabled={!isConnected}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>Capture Photo</span>
          </button>

          {/* Video Recording */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recording Duration:
              </label>
              <select
                value={recordingDuration}
                onChange={(e) => setRecordingDuration(parseInt(e.target.value))}
                className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={isRecording || !isConnected}
              >
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
              </select>
            </div>
            
            <button
              onClick={startVideoRecording}
              disabled={!isConnected}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <StopCircle className="w-5 h-5" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  <span>Start Recording</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status */}
        {commandStatus && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {commandStatus.message}
            </p>
            {commandStatus.error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Error: {commandStatus.error}
              </p>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {new Date(commandStatus.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            📱 Make sure the mobile app is open and connected for remote commands to work.
            Media will be automatically saved to the device gallery and uploaded to the cloud.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RemoteControlPanel;
