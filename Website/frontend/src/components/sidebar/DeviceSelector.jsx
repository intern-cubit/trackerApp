import React, { useState } from 'react';
import { PlusCircle, User, ChevronRight, ChevronDown } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectTracker } from '../../features/trackerSlice';
import TrackerCard from '../sidebar/TrackerCard';
import DeviceTypeSelector from '../DeviceTypeSelector';

const deviceSelectorStyles = `
  .device-selector {
    --bg-primary: rgba(255, 255, 255, 0.8);
    --bg-secondary: rgb(255, 255, 255);
    --border-primary: rgb(229, 231, 235);
    --border-secondary: rgb(229, 231, 235);
    --text-primary: rgb(31, 41, 55);
    --text-secondary: rgb(107, 114, 128);
    --text-tertiary: rgb(107, 114, 128);
    --icon-bg: rgb(238, 242, 255);
    --icon-color: rgb(79, 70, 229);
    --button-primary: rgb(99, 102, 241);
    --button-hover: rgb(79, 70, 229);
    --shadow-hover: rgba(106, 90, 205, 0.2);
  }

  .device-selector.dark {
    --bg-primary: rgba(30, 30, 30, 0.5);
    --bg-secondary: rgb(17, 24, 39);
    --border-primary: rgb(55, 65, 81);
    --border-secondary: rgb(55, 65, 81);
    --text-primary: rgb(229, 231, 235);
    --text-secondary: rgb(209, 213, 219);
    --text-tertiary: rgb(156, 163, 175);
    --icon-bg: rgb(49, 46, 129);
    --icon-color: rgb(196, 181, 253);
    --button-primary: rgb(129, 140, 248);
    --button-hover: rgb(196, 181, 253);
    --shadow-hover: rgba(106, 90, 205, 0.3);
  }

  .device-selector-main {
    background: var(--bg-primary);
    border-color: var(--border-primary);
    color: var(--text-primary);
  }

  .device-selector-main:hover {
    box-shadow: 0 0 15px var(--shadow-hover);
  }

  .device-selector-icon {
    background: var(--icon-bg);
    color: var(--icon-color);
  }

  .device-selector-text-primary {
    color: var(--text-primary);
  }

  .device-selector-text-secondary {
    color: var(--text-secondary);
  }

  .device-selector-text-tertiary {
    color: var(--text-tertiary);
  }

  .device-selector-dropdown {
    background: var(--bg-secondary);
    border-color: var(--border-secondary);
  }

  .device-selector-button {
    color: var(--button-primary);
    transition: color 0.2s ease;
  }

  .device-selector-button:hover {
    color: var(--button-hover);
  }
`;

const DeviceSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const trackers = useSelector((state) => state.tracker.trackers);
    const selectedTrackerId = useSelector((state) => state.tracker.selectedTrackerId);
    const dispatch = useDispatch();

    const selectedTracker = trackers.find(({ tracker }) => tracker._id === selectedTrackerId)?.tracker;

    const handleSelect = (trackerId) => {
        dispatch(selectTracker(trackerId));
        localStorage.setItem('selectedTrackerId', trackerId);
        setIsOpen(false);
    };

    const openAddMobileDeviceModal = (e) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    return (
        <>
            <style>{deviceSelectorStyles}</style>
            <div className={`device-selector ${isDarkMode ? 'dark' : ''} mb-1`}>
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="device-selector-main flex items-center justify-between p-3 backdrop-blur-md border transition-all duration-300 rounded-lg cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="device-selector-icon p-2 rounded-full">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="device-selector-text-primary font-medium">
                                {selectedTracker
                                    ? selectedTracker?.device?.deviceName || `${selectedTracker?.device?.deviceType === "mobile" ? "Mobile" : "Tracker"} ${selectedTracker.deviceId.slice(-4)}`
                                    : "Select a Device"}
                            </p>
                            {selectedTracker && (
                                <p className="device-selector-text-tertiary text-xs">
                                    {selectedTracker?.device?.deviceType === "mobile" 
                                        ? `Mobile ${selectedTracker?.device?.platform ? `(${selectedTracker.device.platform})` : ""}`
                                        : "GPS Tracker"}
                                </p>
                            )}
                        </div>
                    </div>
                    {isOpen ?
                        <ChevronDown size={20} className="device-selector-text-secondary" /> :
                        <ChevronRight size={20} className="device-selector-text-secondary" />
                    }
                </div>

                {isOpen && (
                    <div className="device-selector-dropdown mt-2 p-2 border rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <p className="device-selector-text-secondary text-sm font-medium">My Devices</p>
                            <button
                                className="device-selector-button"
                                onClick={openAddMobileDeviceModal}
                            >
                                <PlusCircle size={18} />
                            </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {trackers.length > 0 ? (
                                trackers.map(({ tracker }) => (
                                    <TrackerCard
                                        key={tracker._id}
                                        tracker={tracker}
                                        selectedTrackerId={selectedTrackerId}
                                        onSelect={() => handleSelect(tracker._id)}
                                    />
                                ))
                            ) : (
                                <div className="device-selector-text-tertiary px-3 py-4 text-center text-sm">
                                    No devices found. Add a new device to get started.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <DeviceTypeSelector
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onDeviceAdded={(device) => {
                    // Refresh trackers list or add to store
                    setIsModalOpen(false);
                }}
            />
        </>
    );
};

export default DeviceSelector;