import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  Smartphone,
  Usb,
  HardDrive,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdvancedSecurityPanel = ({ selectedDevice }) => {
  const [securitySettings, setSecuritySettings] = useState({
    movementLockEnabled: false,
    dontTouchLockEnabled: false,
    usbLockEnabled: false,
    appLockEnabled: false,
    screenLockEnabled: false,
    preventUninstall: true,
    maxFailedAttempts: 3,
    movementSensitivity: 1.5
  });
  const [loading, setLoading] = useState(false);
  
  // Local states for sliders to prevent flickering
  const [localMaxFailedAttempts, setLocalMaxFailedAttempts] = useState(3);
  const [localMovementSensitivity, setLocalMovementSensitivity] = useState(1.5);
  
  // Debounce timer refs
  const debounceTimerRef = useState(null);

  useEffect(() => {
    if (selectedDevice) {
      fetchSecuritySettings();
    }
  }, [selectedDevice]);

  // Update local states when security settings change
  useEffect(() => {
    setLocalMaxFailedAttempts(securitySettings.maxFailedAttempts);
    setLocalMovementSensitivity(securitySettings.movementSensitivity);
  }, [securitySettings.maxFailedAttempts, securitySettings.movementSensitivity]);

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch(`/api/security/settings/${selectedDevice._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.device?.securitySettings) {
        setSecuritySettings(data.device.securitySettings);
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
    }
  };

  const updateSecuritySetting = async (setting, value) => {
    // Update UI immediately for toggle settings
    if (typeof value === 'boolean') {
      setLoading(true);
      try {
        const updatedSettings = { ...securitySettings, [setting]: value };
        
        const response = await fetch(`/api/security/settings/${selectedDevice._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            securitySettings: updatedSettings
          })
        });

        if (response.ok) {
          setSecuritySettings(updatedSettings);
          toast.success(`${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} updated`);
          
          // Send command to device to update setting
          await sendSettingCommand(setting, value);
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to update setting');
        }
      } catch (error) {
        toast.error('Failed to update setting');
      } finally {
        setLoading(false);
      }
    }
  };

  // Debounced function for slider updates
  const debouncedSliderUpdate = useCallback((setting, value) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const updatedSettings = { ...securitySettings, [setting]: value };
        
        const response = await fetch(`/api/security/settings/${selectedDevice._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            securitySettings: updatedSettings
          })
        });

        if (response.ok) {
          setSecuritySettings(updatedSettings);
          toast.success(`${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} updated`);
          
          // Send command to device to update setting
          await sendSettingCommand(setting, value);
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to update setting');
          // Revert local state on error
          if (setting === 'maxFailedAttempts') {
            setLocalMaxFailedAttempts(securitySettings.maxFailedAttempts);
          } else if (setting === 'movementSensitivity') {
            setLocalMovementSensitivity(securitySettings.movementSensitivity);
          }
        }
      } catch (error) {
        toast.error('Failed to update setting');
        // Revert local state on error
        if (setting === 'maxFailedAttempts') {
          setLocalMaxFailedAttempts(securitySettings.maxFailedAttempts);
        } else if (setting === 'movementSensitivity') {
          setLocalMovementSensitivity(securitySettings.movementSensitivity);
        }
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce
  }, [securitySettings, selectedDevice]);

  const sendSettingCommand = async (setting, value) => {
    const commandMap = {
      movementLockEnabled: value ? 'enable_movement_lock' : 'disable_movement_lock',
      dontTouchLockEnabled: value ? 'enable_dont_touch' : 'disable_dont_touch',
      usbLockEnabled: value ? 'enable_usb_lock' : 'disable_usb_lock',
      appLockEnabled: value ? 'enable_app_lock' : 'disable_app_lock',
      screenLockEnabled: value ? 'enable_screen_lock' : 'disable_screen_lock',
      preventUninstall: value ? 'prevent_uninstall' : 'allow_uninstall'
    };

    const commandType = commandMap[setting];
    if (commandType) {
      try {
        await fetch('/api/security/commands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            deviceId: selectedDevice._id,
            commandType,
            parameters: { [setting]: value }
          })
        });
      } catch (error) {
        console.error('Failed to send setting command:', error);
      }
    }
  };

  const SecurityToggle = ({ title, description, icon: Icon, setting, iconColor = "text-blue-600" }) => (
    <motion.div 
      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`h-6 w-6 ${iconColor}`} />
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <button
        onClick={() => updateSecuritySetting(setting, !securitySettings[setting])}
        disabled={loading}
        className="flex items-center"
      >
        {securitySettings[setting] ? (
          <ToggleRight className="h-8 w-8 text-green-600" />
        ) : (
          <ToggleLeft className="h-8 w-8 text-gray-400" />
        )}
      </button>
    </motion.div>
  );

  const SecuritySlider = ({ title, description, setting, min, max, step = 1, unit = "" }) => {
    const isMaxFailedAttempts = setting === 'maxFailedAttempts';
    const isMovementSensitivity = setting === 'movementSensitivity';
    
    const currentValue = isMaxFailedAttempts ? localMaxFailedAttempts : 
                        isMovementSensitivity ? localMovementSensitivity : 
                        securitySettings[setting];
    
    const handleSliderChange = (value) => {
      if (isMaxFailedAttempts) {
        setLocalMaxFailedAttempts(value);
        debouncedSliderUpdate(setting, value);
      } else if (isMovementSensitivity) {
        setLocalMovementSensitivity(value);
        debouncedSliderUpdate(setting, value);
      } else {
        updateSecuritySetting(setting, value);
      }
    };

    return (
      <motion.div 
        className="bg-gray-50 rounded-lg p-4"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <span className="text-lg font-semibold text-blue-600">
            {currentValue}{unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          disabled={loading}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </motion.div>
    );
  };

  if (!selectedDevice) {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Select a device to configure advanced security settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Advanced Security Controls</h2>
        <p className="text-blue-100">Configure comprehensive security features for {selectedDevice.device?.deviceName || 'Unknown Device'}</p>
      </div>

      {/* Device Protection Features */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Device Protection
        </h3>
        
        <div className="space-y-4">
          <SecurityToggle
            title="Movement Lock"
            description="Lock device when movement or rotation is detected"
            icon={Smartphone}
            setting="movementLockEnabled"
            iconColor="text-purple-600"
          />
          
          <SecurityToggle
            title="Don't Touch Lock"
            description="Trigger alarm when device is touched or moved"
            icon={Eye}
            setting="dontTouchLockEnabled"
            iconColor="text-yellow-600"
          />
          
          <SecurityToggle
            title="USB Lock"
            description="Block unauthorized USB data access"
            icon={Usb}
            setting="usbLockEnabled"
            iconColor="text-red-600"
          />
          
          <SecurityToggle
            title="Enhanced Screen Lock"
            description="Custom lock screen with biometric protection"
            icon={Lock}
            setting="screenLockEnabled"
            iconColor="text-indigo-600"
          />
        </div>
      </motion.div>

      {/* App Protection Features */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-green-600" />
          App Protection
        </h3>
        
        <div className="space-y-4">
          <SecurityToggle
            title="App Lock"
            description="Protect individual apps with additional security"
            icon={Lock}
            setting="appLockEnabled"
            iconColor="text-green-600"
          />
          
          <SecurityToggle
            title="Prevent App Uninstall"
            description="Block unauthorized removal of the tracker app"
            icon={RotateCcw}
            setting="preventUninstall"
            iconColor="text-orange-600"
          />
        </div>
      </motion.div>

      {/* Security Configuration */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-gray-600" />
          Security Configuration
        </h3>
        
        <div className="space-y-4">
          <SecuritySlider
            title="Maximum Failed Attempts"
            description="Number of failed login attempts before auto-lock"
            setting="maxFailedAttempts"
            min={1}
            max={10}
            step={1}
          />
          
          <SecuritySlider
            title="Movement Sensitivity"
            description="Sensitivity level for movement detection"
            setting="movementSensitivity"
            min={0.1}
            max={5.0}
            step={0.1}
          />
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="bg-white rounded-lg shadow-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <HardDrive className="h-5 w-5 mr-2 text-teal-600" />
          Performance Actions
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => sendSettingCommand('clearCache', true)}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <HardDrive className="h-8 w-8 text-teal-600 mb-2" />
            <span className="text-sm font-medium text-teal-800">Clear Cache</span>
          </button>

          <button
            onClick={() => sendSettingCommand('optimizePerformance', true)}
            disabled={loading}
            className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-800">Optimize RAM</span>
          </button>
        </div>
      </motion.div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default AdvancedSecurityPanel;
