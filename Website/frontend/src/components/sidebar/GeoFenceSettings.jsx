import React from 'react';
import { MapPin } from 'lucide-react';
import { useSelector } from 'react-redux';

// CSS Variables for theming
const geoFenceStyles = `
  .geofence-settings {
    --bg-primary: rgb(249, 250, 251);
    --text-primary: rgb(17, 24, 39);
    --text-secondary: rgb(107, 114, 128);
    --text-tertiary: rgb(107, 114, 128);
    --icon-bg: rgb(147, 51, 234);
    --icon-color: rgb(255, 255, 255);
    --accent-color: rgb(147, 51, 234);
  }

  .geofence-settings.dark {
    --bg-primary: rgb(31, 41, 55);
    --text-primary: rgb(243, 244, 246);
    --text-secondary: rgb(209, 213, 219);
    --text-tertiary: rgb(156, 163, 175);
    --icon-bg: rgb(147, 51, 234);
    --icon-color: rgb(255, 255, 255);
    --accent-color: rgb(196, 181, 253);
  }

  .geofence-container {
    background: var(--bg-primary);
  }

  .geofence-icon-bg {
    background: var(--icon-bg);
    color: var(--icon-color);
  }

  .geofence-title {
    color: var(--text-primary);
  }

  .geofence-text-primary {
    color: var(--text-primary);
  }

  .geofence-text-secondary {
    color: var(--text-secondary);
  }

  .geofence-text-tertiary {
    color: var(--text-tertiary);
  }

  .geofence-accent {
    color: var(--accent-color);
  }
`;

const GeoFenceSettings = ({ selectedTracker }) => {
    if (!selectedTracker) return null;
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    return (
        <>
            <style>{geoFenceStyles}</style>
            <div className={`geofence-settings ${isDarkMode ? 'dark' : ''} geofence-container p-4 rounded-lg mb-4`}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="geofence-icon-bg rounded-full w-8 h-8 flex items-center justify-center">
                        <MapPin size={16} />
                    </div>
                    <h3 className="geofence-title font-medium">Geofence Settings</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="geofence-text-tertiary text-xs mb-1">Home Location</p>
                        <div className="flex items-center gap-1">
                            <MapPin size={14} className="geofence-accent" />
                            <p className="geofence-text-primary font-medium">
                                {selectedTracker?.tracker?.geoFence?.homeLatitude?.toFixed(5) || "N/A"} {selectedTracker?.tracker?.geoFence?.homeLongitude?.toFixed(5) || "N/A"}
                            </p>
                        </div>
                        <p className="geofence-text-tertiary text-xs mt-1">
                            {selectedTracker?.tracker?.geoFence?.timestamp || "N/A"}
                        </p>
                    </div>

                    <div>
                        <p className="geofence-text-tertiary text-xs mb-1">Geofence Radius</p>
                        <div className="flex items-center gap-1">
                            <p className="geofence-text-primary font-medium">
                                {selectedTracker?.tracker?.geoFence?.radius || "N/A"}
                            </p>
                        </div>
                    </div>

                    <p className="geofence-text-tertiary text-xs">
                        Geofence alerts are sent when the device travels beyond the specified radius from home.
                    </p>
                </div>
            </div>
        </>
    );
};

export default GeoFenceSettings;