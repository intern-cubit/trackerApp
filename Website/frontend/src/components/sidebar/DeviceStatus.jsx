import React, { useState, useEffect } from 'react';
import { Info, Battery, Clock, MapPin, Truck, Home, Circle, Car, Bike, AlertCircle, Edit, ChevronRight, ToggleLeft, ToggleRight, Smartphone } from 'lucide-react';
import UpdateGeofence from '../UpdateGeofence';
import { useSelector } from 'react-redux';

const DeviceStatus = ({ selectedTracker: initialTrackerData }) => {
    const [selectedTracker, setSelectedTracker] = useState(initialTrackerData || null);
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');

    const [geoFenceActive, setGeoFenceActive] = useState(
        selectedTracker?.tracker?.geoFence?.isActive || false
    );

    useEffect(() => {
        if (initialTrackerData) {
            setSelectedTracker(initialTrackerData);
            setGeoFenceActive(initialTrackerData?.tracker?.geoFence?.isActive || false);
        }
    }, [initialTrackerData]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [radiusInput, setRadiusInput] = useState('');

    const redirectToGeofenceSetup = () => {
        if (selectedTracker?.tracker?.geoFence?.radius) {
            const numericRadius = selectedTracker.tracker.geoFence.radius.replace(/[^0-9]/g, '');
            setRadiusInput(numericRadius);
        } else {
            setRadiusInput('500');
        }
        setIsModalOpen(true);
    };

    const updateGeofenceSettings = () => {
        const radius = selectedTracker?.tracker?.geoFence?.radius;

        if (radius !== undefined && radius !== null) {
            const numericRadius = typeof radius === 'string'
                ? radius.replace(/[^0-9]/g, '')
                : String(radius);

            setRadiusInput(numericRadius);
        }

        setIsModalOpen(true);
    };

    const toggleGeofence = () => {
        const newStatus = !geoFenceActive;
        setGeoFenceActive(newStatus);

        if (newStatus && !hasGeofenceData()) {
            redirectToGeofenceSetup();
            return;
        }

        setSelectedTracker(prev => ({
            ...prev,
            tracker: {
                ...prev.tracker,
                geoFence: {
                    ...prev.tracker.geoFence,
                    isActive: newStatus
                }
            }
        }));
    };

    const hasGeofenceData = () => {
        const geoFence = selectedTracker?.tracker?.geoFence;
        return geoFence && geoFence.homeLatitude && geoFence.homeLongitude && geoFence.radius;
    };

    if (!selectedTracker) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-md mb-6 p-8 text-center backdrop-blur-sm">
                <AlertCircle size={24} className="mx-auto mb-2 text-[var(--warning-color)]" />
                <p className="text-[var(--secondary-text)]">No tracker data available</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return "Invalid date";
        }
    };

    const formattedTime = formatDate(selectedTracker?.latest?.timestamp);
    const device = selectedTracker?.tracker?.device || {};
    const geoFence = selectedTracker?.tracker?.geoFence || {};

    const batteryLevel = selectedTracker?.latest?.battery
        ? parseInt(selectedTracker.latest.battery)
        : 0;

    const getBatteryColor = (level) => {
        if (level > 70) return "bg-[var(--success-color)]";
        if (level > 30) return "bg-[var(--warning-color)]";
        return "bg-[var(--danger-color)]";
    };

    const formatCoordinate = (coord) => {
        return coord !== null && coord !== undefined ? coord.toFixed(5) : "—";
    };

    // CSS variables style object
    const cssVariables = {
        '--card-bg': isDarkMode ? 'hsla(0,0%,8%,1)' : 'rgba(255,255,255,0.95)',
        '--border-color': isDarkMode ? 'rgb(31 41 55)' : 'rgb(229 231 235)',
        '--header-bg': isDarkMode ? 'linear-gradient(to right, rgb(55 48 163), rgb(88 28 135))' : 'linear-gradient(to right, rgb(79 70 229), rgb(124 58 237))',
        '--header-border': isDarkMode ? 'rgb(67 56 202)' : 'rgb(99 102 241)',
        '--primary-text': isDarkMode ? 'rgb(229 231 235)' : 'rgb(17 24 39)',
        '--secondary-text': isDarkMode ? 'rgb(156 163 175)' : 'rgb(107 114 128)',
        '--muted-text': isDarkMode ? 'rgb(107 114 128)' : 'rgb(156 163 175)',
        '--accent-color': isDarkMode ? 'rgb(165 180 252)' : 'rgb(79 70 229)',
        '--purple-accent': isDarkMode ? 'rgb(196 181 253)' : 'rgb(124 58 237)',
        '--success-color': isDarkMode ? 'rgb(34 197 94)' : 'rgb(22 163 74)',
        '--warning-color': isDarkMode ? 'rgb(234 179 8)' : 'rgb(202 138 4)',
        '--danger-color': isDarkMode ? 'rgb(239 68 68)' : 'rgb(220 38 38)',
        '--status-online-bg': isDarkMode ? 'rgb(20 83 45)' : 'rgb(240 253 244)',
        '--status-online-text': isDarkMode ? 'rgb(134 239 172)' : 'rgb(22 163 74)',
        '--status-online-border': isDarkMode ? 'rgb(21 128 61)' : 'rgb(34 197 94)',
        '--status-offline-bg': isDarkMode ? 'rgb(17 24 39)' : 'rgb(249 250 251)',
        '--status-offline-text': isDarkMode ? 'rgb(156 163 175)' : 'rgb(107 114 128)',
        '--status-offline-border': isDarkMode ? 'rgb(55 65 81)' : 'rgb(209 213 219)',
        '--vehicle-placeholder-bg': isDarkMode ? 'rgb(17 24 39)' : 'rgb(243 244 246)',
        '--vehicle-border': isDarkMode ? 'rgb(55 65 81)' : 'rgb(209 213 219)',
        '--toggle-active': isDarkMode ? 'rgb(196 181 253)' : 'rgb(124 58 237)',
        '--toggle-inactive': isDarkMode ? 'rgb(75 85 99)' : 'rgb(156 163 175)',
        '--button-bg': isDarkMode ? 'rgb(88 28 135)' : 'rgb(124 58 237)',
        '--button-hover': isDarkMode ? 'rgb(107 33 168)' : 'rgb(109 40 217)',
        '--button-border': isDarkMode ? 'rgb(147 51 234)' : 'rgb(139 69 255)',
        '--dashed-border': isDarkMode ? 'rgb(55 65 81)' : 'rgb(209 213 219)',
        '--inactive-bg': isDarkMode ? 'rgba(30,30,30,0.4)' : 'rgba(243,244,246,0.8)',
        '--battery-track': isDarkMode ? 'rgb(31 41 55)' : 'rgb(229 231 235)',
        '--purple-border': isDarkMode ? 'rgb(107 33 168)' : 'rgb(139 69 255)',
        '--shadow-color': isDarkMode ? 'rgba(106,90,205,0.25)' : 'rgba(0,0,0,0.1)'
    };

    return (
        <div
            className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg mb-6 overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_15px_var(--shadow-color)]"
            style={cssVariables}
        >
            {/* Status Header */}
            <div className="bg-[var(--header-bg)] px-4 py-3 text-white flex justify-between items-center border-b border-[var(--header-border)]">
                <div className="flex items-center gap-2">
                    <Info size={18} className="text-[var(--primary-text)] opacity-80" />
                    <h3 className="font-semibold text-[var(--primary-text)]">Device Status</h3>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${selectedTracker.status === 'Online'
                    ? 'bg-[var(--status-online-bg)] text-[var(--status-online-text)] border border-[var(--status-online-border)]'
                    : 'bg-[var(--status-offline-bg)] text-[var(--status-offline-text)] border border-[var(--status-offline-border)]'
                    }`}>
                    {selectedTracker.status}
                </span>
            </div>

            {/* Vehicle Information */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex gap-4 items-center">
                    {device.profilePic ? (
                        <img
                            src={device.profilePic}
                            alt={device.deviceName || "Device"}
                            className="w-20 h-20 rounded-lg object-cover border border-[var(--vehicle-border)] shadow-md"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-[var(--vehicle-placeholder-bg)] rounded-lg flex items-center justify-center border border-[var(--vehicle-border)] shadow-inner">
                            <Smartphone size={36} className="text-[var(--accent-color)]" />;
                        </div>
                    )}
                    <div className="flex-1">
                        <h4 className="font-bold text-lg text-[var(--primary-text)]">{device.deviceName || "Unnamed Device"}</h4>
                        <div className="flex flex-col gap-1 mt-1">
                            <p className="text-sm font-medium text-[var(--secondary-text)]">
                                <span className="inline-block w-16 text-[var(--muted-text)]">Number:</span>
                                {device.mobile || "—"}
                            </p>
                            <p className="text-sm font-medium text-[var(--secondary-text)]">
                                <span className="inline-block w-16 text-[var(--muted-text)]">Type:</span>
                                Mobile
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Location Information */}
            <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-[var(--accent-color)]" />
                    <h4 className="font-medium text-[var(--primary-text)]">Current Location</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <p className="text-xs text-[var(--muted-text)]">Latitude</p>
                        <p className="font-medium text-[var(--secondary-text)]">{formatCoordinate(selectedTracker?.latest?.latitude)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-[var(--muted-text)]">Longitude</p>
                        <p className="font-medium text-[var(--secondary-text)]">{formatCoordinate(selectedTracker?.latest?.longitude)}</p>
                    </div>
                </div>
            </div>

            {/* <div className="p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="text-[var(--purple-accent)]">
                            <Home size={16} />
                        </div>
                        <h4 className="font-medium text-[var(--primary-text)]">Geofence</h4>
                    </div>

                    <button
                        onClick={toggleGeofence}
                        className="flex items-center gap-1.5 focus:outline-none"
                        aria-label={geoFenceActive ? "Deactivate geofence" : "Activate geofence"}
                    >
                        <span className="text-xs font-medium text-[var(--muted-text)]">
                            {geoFenceActive ? "Active" : "Inactive"}
                        </span>
                        {geoFenceActive ? (
                            <ToggleRight size={20} className="text-[var(--toggle-active)]" />
                        ) : (
                            <ToggleLeft size={20} className="text-[var(--toggle-inactive)]" />
                        )}
                    </button>
                </div>

                {geoFenceActive ? (
                    hasGeofenceData() ? (
                        <div className="space-y-3 my-2">
                            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                                <div>
                                    <p className="text-xs text-[var(--muted-text)]">Latitude</p>
                                    <p className="font-medium text-[var(--secondary-text)]">{formatCoordinate(geoFence?.homeLatitude)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted-text)]">Longitude</p>
                                    <p className="font-medium text-[var(--secondary-text)]">{formatCoordinate(geoFence?.homeLongitude)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-[var(--purple-accent)]">
                                        <Circle size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted-text)]">Radius</p>
                                        <p className="font-medium text-[var(--secondary-text)]">{geoFence?.radius || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-[var(--muted-text)] italic border-l-2 border-[var(--purple-border)] pl-2">
                                    Alerts are sent when the device travels beyond this radius from home.
                                </p>
                                <button
                                    onClick={updateGeofenceSettings}
                                    className="flex items-center px-3 py-1.5 rounded-md text-xs font-medium text-white bg-[var(--button-bg)] hover:bg-[var(--button-hover)] border border-[var(--button-border)]"
                                >
                                    <Edit size={12} className="mr-1" />
                                    Update
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="flex items-center gap-2 mb-2 text-[var(--warning-color)]">
                                <AlertCircle size={18} />
                                <p className="text-sm font-medium">Geofence not configured</p>
                            </div>
                            <button
                                onClick={redirectToGeofenceSetup}
                                className="flex items-center mt-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-[var(--button-bg)] hover:bg-[var(--button-hover)] border border-[var(--button-border)] transition-colors"
                            >
                                Set Up Geofence
                                <ChevronRight size={16} className="ml-1" />
                            </button>
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center py-4 px-2 border border-dashed border-[var(--dashed-border)] rounded-lg bg-[var(--inactive-bg)]">
                        <p className="text-sm text-[var(--muted-text)] text-center">
                            Geofence is currently inactive. Activate it to receive alerts when your vehicle leaves the designated area.
                        </p>
                    </div>
                )}
            </div> */}

            {/* Device Information */}
            {/* <div className="p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="text-[var(--accent-color)]">
                            <Clock size={16} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-[var(--muted-text)]">Last Update</p>
                            <p className="font-medium text-[var(--secondary-text)]">{formattedTime}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-[var(--accent-color)]">
                            <Battery size={16} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <p className="text-xs text-[var(--muted-text)]">Battery</p>
                                <p className="text-xs font-medium text-[var(--secondary-text)]">{selectedTracker?.latest?.battery || "N/A"}</p>
                            </div>
                            <div className="w-full bg-[var(--battery-track)] rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getBatteryColor(batteryLevel)}`}
                                    style={{ width: `${batteryLevel}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default DeviceStatus;