import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Clock, 
  X 
} from 'lucide-react';

const RemoteAlarmPanel = ({ isOpen, onClose, selectedDevice }) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendAlarmCommand = async (commandType, duration = null) => {
    if (!selectedDevice) {
      alert('Please select a device first');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        deviceId: selectedDevice._id,
        commandType: commandType,
        parameters: duration ? { duration } : {}
      };

      const response = await fetch('/api/security/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ ${commandType} command sent successfully:`, result);
        if (commandType === 'remote_alarm') {
          alert(`Alarm activated for ${duration} seconds!`);
        } else {
          alert('Alarm stopped successfully!');
        }
      } else {
        console.error(`❌ Failed to send ${commandType} command:`, result);
        alert(`Failed to ${commandType === 'remote_alarm' ? 'start' : 'stop'} alarm: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error sending ${commandType} command:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-lg mx-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Remote Alarm Control
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {selectedDevice ? (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Device:</strong> {selectedDevice.deviceName || selectedDevice.deviceId}
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => sendAlarmCommand('remote_alarm', 30)}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    <Volume2 size={24} className="mb-2" />
                    <span className="text-sm font-medium">30s Alarm</span>
                  </button>

                  <button
                    onClick={() => sendAlarmCommand('remote_alarm', 60)}
                    disabled={isLoading}
                    className="flex flex-col items-center p-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    <Clock size={24} className="mb-2" />
                    <span className="text-sm font-medium">60s Alarm</span>
                  </button>
                </div>

                <button
                  onClick={() => sendAlarmCommand('stop_alarm')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center p-4 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <VolumeX size={20} className="mr-2" />
                  <span className="font-medium">Stop Alarm</span>
                </button>
              </div>

              {isLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Sending command...
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-600">Please select a device to control the alarm.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RemoteAlarmPanel;
