import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Camera, 
  Video, 
  Lock, 
  Unlock, 
  Volume2, 
  VolumeX, 
  AlertTriangle,
  Smartphone,
  Zap,
  RotateCcw,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const SecurityPanel = ({ selectedDevice }) => {
  const [commands, setCommands] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (selectedDevice) {
      fetchSecurityEvents();
      fetchCommandHistory();
    }
  }, [selectedDevice]);

  // Show device selection prompt if no device is selected
  if (!selectedDevice) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Device Selected</h3>
          <p className="text-sm text-gray-500">
            Please select a device to access security controls and remote alarm features.
          </p>
        </div>
      </div>
    );
  }

  const fetchSecurityEvents = async () => {
    if (!selectedDevice?._id) return;
    
    const deviceId = selectedDevice?.tracker?._id || selectedDevice?._id;
    if (!deviceId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/security/events/${deviceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Security events endpoint not found, security events feature may not be enabled');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Response is not JSON, skipping security events');
        return;
      }
      
      const data = await response.json();
      setSecurityEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch security events:', error);
      // Don't show user error for this, it's not critical
    }
  };

  const fetchCommandHistory = async () => {
    if (!selectedDevice?._id) return;
    
    const deviceId = selectedDevice?.tracker?._id || selectedDevice?._id;
    if (!deviceId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/security/commands/device/${deviceId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Command history endpoint not found, commands feature may not be enabled');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Response is not JSON, skipping command history');
        return;
      }
      
      const data = await response.json();
      setCommands(data.commands || []);
    } catch (error) {
      console.error('Failed to fetch command history:', error);
      // Don't show user error for this, it's not critical
    }
  };

  const sendCommand = async (commandType, parameters = {}) => {
    console.log(`Sending command: ${commandType}`, parameters);
    console.log('Selected device:', selectedDevice);
    
    // Use the tracker ID from selectedDevice.tracker._id as that's what the backend expects
    const deviceId = selectedDevice?.tracker?._id || selectedDevice?._id;
    
    if (!deviceId) {
      console.log('Please select a device first');
      toast.error('Please select a device first');
      return;
    }
    console.log(`Sending command to device ID: ${deviceId}`);

    setLoading(true);
    try {
      console.log(`Sending command: ${commandType}`, parameters);
      const response = await fetch(`${BACKEND_URL}/api/security/commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deviceId: deviceId,
          commandType,
          parameters
        })
      });

      console.log('Command response:', response);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Security commands feature is not available. Please check your server configuration.');
          return;
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        toast.error('Invalid server response format');
        return;
      }

      const data = await response.json();
      console.log(data)
      toast.success(`${commandType.replace('_', ' ')} command sent successfully`);
      fetchCommandHistory();
    } catch (error) {
      toast.error('Failed to send command');
      console.error('Command error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyAction = (action) => {
    const confirmations = {
      emergency_lock: 'Are you sure you want to emergency lock this device?',
      emergency_alarm: 'Are you sure you want to trigger an emergency alarm?',
      emergency_wipe: 'WARNING: This will permanently wipe the device. Are you sure?',
      emergency_locate: 'This will force the device to send its current location.'
    };

    if (window.confirm(confirmations[action])) {
      sendEmergencyCommand(action);
    }
  };

  const sendEmergencyCommand = async (action) => {
    setLoading(true);
    try {
      const reason = prompt('Enter reason for emergency action:') || 'Emergency action triggered from dashboard';
      
      const response = await fetch(`${BACKEND_URL}/api/security/emergency/${selectedDevice._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, reason })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Emergency ${action.replace('emergency_', '')} initiated`);
        fetchSecurityEvents();
        fetchCommandHistory();
      } else {
        toast.error(data.message || 'Failed to execute emergency action');
      }
    } catch (error) {
      toast.error('Failed to execute emergency action');
      console.error('Emergency action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventIcon = (eventType) => {
    const iconMap = {
      failed_login: AlertTriangle,
      auto_lock: Lock,
      sos_alert: AlertTriangle,
      movement_detected: Smartphone,
      remote_lock: Lock,
      alarm_triggered: Volume2,
      photo_captured: Camera,
      video_captured: Video,
    };
    
    const IconComponent = iconMap[eventType] || AlertTriangle;
    return <IconComponent className="h-5 w-5" />;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600', 
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  };

  const getCommandStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600',
      sent: 'text-blue-600',
      acknowledged: 'text-purple-600',
      completed: 'text-green-600',
      failed: 'text-red-600',
      timeout: 'text-gray-600'
    };
    return colors[status] || 'text-gray-600';
  };

  if (!selectedDevice) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">Select a device to view security features</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Remote Commands
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => sendCommand('remote_lock')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Lock className="h-8 w-8 text-red-600 mb-2" />
            <span className="text-sm font-medium text-red-800">Lock Device</span>
          </button>

          <button
            onClick={() => sendCommand('remote_unlock')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Unlock className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-800">Unlock Device</span>
          </button>

          <button
            onClick={() => sendCommand('remote_alarm', { duration: 30 })}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Volume2 className="h-8 w-8 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-800">Sound Alarm</span>
          </button>

          <button
            onClick={() => sendCommand('stop_alarm')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <VolumeX className="h-8 w-8 text-gray-600 mb-2" />
            <span className="text-sm font-medium text-gray-800">Stop Alarm</span>
          </button>

          <button
            onClick={() => sendCommand('capture_photo')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Camera className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-800">Capture Photo</span>
          </button>

          <button
            onClick={() => sendCommand('capture_video', { duration: 15 })}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Video className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-800">Record Video</span>
          </button>

          <button
            onClick={() => sendCommand('clear_cache')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Zap className="h-8 w-8 text-indigo-600 mb-2" />
            <span className="text-sm font-medium text-indigo-800">Clear Cache</span>
          </button>

          <button
            onClick={() => sendCommand('enable_movement_lock')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Shield className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-800">Movement Lock</span>
          </button>

          <button
            onClick={() => sendCommand('enable_dont_touch')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <AlertTriangle className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-800">Don't Touch</span>
          </button>

          <button
            onClick={() => sendCommand('get_status')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Settings className="h-8 w-8 text-teal-600 mb-2" />
            <span className="text-sm font-medium text-teal-800">Get Status</span>
          </button>
        </div>
      </motion.div>

      {/* Emergency Actions */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
          Emergency Actions
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleEmergencyAction('emergency_lock')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50 border-2 border-red-300"
          >
            <Lock className="h-8 w-8 text-red-700 mb-2" />
            <span className="text-sm font-medium text-red-800">Emergency Lock</span>
          </button>

          <button
            onClick={() => handleEmergencyAction('emergency_alarm')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors disabled:opacity-50 border-2 border-orange-300"
          >
            <Volume2 className="h-8 w-8 text-orange-700 mb-2" />
            <span className="text-sm font-medium text-orange-800">Emergency Alarm</span>
          </button>

          <button
            onClick={() => handleEmergencyAction('emergency_locate')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50 border-2 border-blue-300"
          >
            <Smartphone className="h-8 w-8 text-blue-700 mb-2" />
            <span className="text-sm font-medium text-blue-800">Force Locate</span>
          </button>

          <button
            onClick={() => handleEmergencyAction('emergency_wipe')}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-red-200 hover:bg-red-300 rounded-lg transition-colors disabled:opacity-50 border-2 border-red-500"
          >
            <RotateCcw className="h-8 w-8 text-red-800 mb-2" />
            <span className="text-sm font-medium text-red-900">Factory Reset</span>
          </button>
        </div>
      </motion.div>

      {/* Recent Security Events */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
        
        {securityEvents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No security events recorded</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {securityEvents.slice(0, 10).map((event) => (
              <div key={event._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`${getSeverityColor(event.severity)}`}>
                    {getEventIcon(event.eventType)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{formatEventType(event.eventType)}</p>
                    <p className="text-xs text-gray-500">{event.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${getSeverityColor(event.severity)}`}>
                    {event.severity.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Command History */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4">Command History</h3>
        
        {commands.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No commands executed</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {commands.slice(0, 10).map((command) => (
              <div key={command._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{formatEventType(command.commandType)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(command.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium ${getCommandStatusColor(command.status)}`}>
                    {command.status.toUpperCase()}
                  </p>
                  {command.error && (
                    <p className="text-xs text-red-500">{command.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SecurityPanel;
