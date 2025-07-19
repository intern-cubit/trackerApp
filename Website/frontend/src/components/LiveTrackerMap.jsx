import React, { useEffect, useRef, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    useMap,
    CircleMarker,
    Tooltip,
    Circle,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Maximize, Minimize, Navigation, Plus, Minus, Crosshair, Home } from 'lucide-react';
import { useSelector } from 'react-redux';

// Fix for default Leaflet icons (these are external and don't need theme changes)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// device Icon (external image, does not change with theme)
const deviceIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
});


// MapController component to handle map functions (no direct visual styles)
const MapController = ({ onMapReady, shouldCenterMap, onCentered, followDevice, position }) => {
    const map = useMap();

    useEffect(() => {
        if (map) {
            onMapReady(map);
        }
    }, [map, onMapReady]);

    useEffect(() => {
        if (shouldCenterMap && position && position[0] !== 0) {
            map.setView(position, map.getZoom(), { animate: true });
            onCentered();
        }
    }, [shouldCenterMap, position, map, onCentered]);

    useEffect(() => {
        if (followDevice && position && position[0] !== 0) {
            map.setView(position, map.getZoom(), { animate: true });
        }
    }, [position, followDevice, map]);

    return null;
};

const LayerController = ({ currentLayer }) => {
    const map = useMap();

    useEffect(() => {
        // This component doesn't need to change anything based on currentLayer within itself
        // The TileLayer key prop already handles re-rendering
    }, [currentLayer, map]);

    return null;
};


// Map Controls
// NOTE: isFollowing, commonButtonStyles, commonButtonHoverStyles, and currentStyles
// need to be passed down from the parent LiveTrackerMap component.
const MapControls = ({ onCenterMap, onZoomIn, onZoomOut, onToggleFullscreen, onToggleFollow, isFollowing, commonButtonStyles, commonButtonHoverStyles, currentStyles }) => {
    return (
        <div className="absolute bottom-6 right-4 flex flex-col gap-2 z-[1000]">
            <button
                onClick={onCenterMap}
                className="p-2 rounded-full shadow-md backdrop-blur-md"
                style={commonButtonStyles}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = commonButtonHoverStyles.boxShadow}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = commonButtonStyles.boxShadow}
                title="Center on Device"
            >
                <Crosshair className="w-5 h-5" style={{ color: currentStyles.brandIconColor }} />
            </button>
            <button
                onClick={onZoomIn}
                className="p-2 rounded-full shadow-md backdrop-blur-md"
                style={commonButtonStyles}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = commonButtonHoverStyles.boxShadow}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = commonButtonStyles.boxShadow}
                title="Zoom In"
            >
                <Plus className="w-5 h-5" style={{ color: currentStyles.brandIconColor }} />
            </button>
            <button
                onClick={onZoomOut}
                className="p-2 rounded-full shadow-md backdrop-blur-md"
                style={commonButtonStyles}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = commonButtonHoverStyles.boxShadow}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = commonButtonStyles.boxShadow}
                title="Zoom Out"
            >
                <Minus className="w-5 h-5" style={{ color: currentStyles.brandIconColor }} />
            </button>
            <button
                onClick={onToggleFollow}
                className={`p-2 flex justify-center items-center rounded-full shadow-md border backdrop-blur-md transition-all duration-300`}
                style={{
                    backgroundColor: isFollowing ? currentStyles.followingActiveBg : commonButtonStyles.backgroundColor,
                    border: isFollowing ? currentStyles.followingActiveBorder : commonButtonStyles.border,
                    color: isFollowing ? currentStyles.followingActiveText : commonButtonStyles.color,
                    boxShadow: 'none', // Default no shadow
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = commonButtonHoverStyles.boxShadow}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                title={isFollowing ? "Following ON" : "Following OFF"}
            >
                <Navigation className="w-5 h-5" />
            </button>
        </div>
    );
};


export default function LiveTrackerMap({ selectedDevice, path, latest, deviceDetails }) {
    const [mapInstance, setMapInstance] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [followDevice, setFollowDevice] = useState(true);
    const [shouldCenterMap, setShouldCenterMap] = useState(false);

    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    // Define styles for light mode
    const lightStyles = {
        mapBackground: { backgroundColor: '#f0f2f5' }, // light background for overall map div
        buttonBg: 'rgba(255, 255, 255, 0.8)',
        buttonBorder: '1px solid #d1d5db',
        buttonText: '#4b5563', // gray-700
        buttonHoverShadow: '0 0 15px rgba(79, 70, 229, 0.2)', // indigo-500 shadow
        brandIconColor: '#4f46e5', // blue-400 equivalent for light
        followingActiveBg: '#4f46e5', // blue-600
        followingActiveBorder: '1px solid #4338ca', // blue-700
        followingActiveText: '#ffffff',
        tooltipBg: 'rgba(255, 255, 255, 0.9)',
        tooltipText: '#4f46e5', // blue-400
        tooltipBorder: '1px solid #d1d5db', // gray-800
        homeIconBorder: '2px solid #34d399', // green-400
        homeIconSvg: '#34d399', // green-400
        homeTooltipText: '#34d399', // green-400
        infoBoxBg: 'rgba(255, 255, 255, 0.8)',
        infoBoxBorder: '1px solid #d1d5db',
        infoBoxText: '#4b5563',
        infoBoxHighlightText: '#4f46e5', // blue-400
    };

    // Define styles for dark mode
    const darkStyles = {
        mapBackground: { backgroundColor: '#0d1117' }, // dark background for overall map div
        buttonBg: 'rgba(30,30,30,0.7)',
        buttonBorder: '1px solid #1f2937', // gray-800
        buttonText: '#d1d5db', // gray-300
        buttonHoverShadow: '0 0 15px rgba(106,90,205,0.3)',
        brandIconColor: '#60a5fa', // blue-400
        followingActiveBg: '#2563eb', // blue-600
        followingActiveBorder: '1px solid #1d4ed8', // blue-700
        followingActiveText: '#ffffff',
        tooltipBg: 'rgba(30,30,30,0.9)',
        tooltipText: '#60a5fa', // blue-400
        tooltipBorder: '1px solid #1f2937', // gray-800
        homeIconBorder: '2px solid #4ade80', // green-400
        homeIconSvg: '#4ade80', // green-400
        homeTooltipText: '#4ade80', // green-400
        infoBoxBg: 'rgba(30,30,30,0.7)',
        infoBoxBorder: '1px solid #1f2937',
        infoBoxText: '#d1d5db',
        infoBoxHighlightText: '#60a5fa', // blue-400
    };

    // Choose the current styles based on isDarkMode
    const currentStyles = isDarkMode ? darkStyles : lightStyles;

    // Home Icon (dynamic based on theme)
    const homeIcon = new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: rgba(0, 0, 0, 0.6); padding: 5px; border-radius: 50%; display: flex; justify-content: center; align-items: center; border: ${currentStyles.homeIconBorder};">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${currentStyles.homeIconSvg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const lastPosition = latest && latest.length === 2 ? latest : [51.505, -0.09];
    const homeLocation = selectedDevice?.tracker?.geoFence
        ? [selectedDevice?.tracker?.geoFence?.homeLatitude, selectedDevice?.tracker?.geoFence?.homeLongitude]
        : null;
    const geoFenceRadius = selectedDevice?.tracker?.geoFence?.radius || 0;
    const isActive = selectedDevice?.tracker?.geoFence?.isActive;

    const mapLayers = [
        {
            name: 'Dark',
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; OpenStreetMap contributors &copy; Carto'
        },
        {
            name: 'Satellite',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: 'Tiles &copy; Esri'
        },
        {
            name: 'Standard',
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; OpenStreetMap contributors'
        },
    ];

    const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
    const currentLayer = mapLayers[currentLayerIndex];

    const handleMapReady = (map) => {
        setMapInstance(map);
    };

    const handleCenterMap = () => {
        if (latest) {
            setShouldCenterMap(true);
            setFollowDevice(true); // Auto-follow when centered
        }
    };

    const handleCentered = () => {
        setShouldCenterMap(false);
    };

    const handleZoomIn = () => {
        if (mapInstance) {
            mapInstance.setZoom(mapInstance.getZoom() + 1);
        }
    };

    const handleZoomOut = () => {
        if (mapInstance) {
            mapInstance.setZoom(mapInstance.getZoom() - 1);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        // Invalidate map size after fullscreen toggle to re-render tiles correctly
        setTimeout(() => {
            if (mapInstance) {
                mapInstance.invalidateSize();
            }
        }, 300);
    };

    const cycleMapLayer = () => {
        setCurrentLayerIndex((currentLayerIndex + 1) % mapLayers.length);
    };

    const toggleFollow = () => setFollowDevice(prev => !prev);

    // Common style for action buttons (zoom, center, follow)
    const commonButtonStyles = {
        backgroundColor: currentStyles.buttonBg,
        border: currentStyles.buttonBorder,
        color: currentStyles.buttonText,
        transition: 'all 0.3s',
        boxShadow: 'none', // Default no shadow
    };

    const commonButtonHoverStyles = {
        boxShadow: currentStyles.buttonHoverShadow,
    };

    return (
        <div
            className={`relative ${isFullscreen ? 'fixed inset-0' : 'w-full h-full'} z-0`}
            style={currentStyles.mapBackground}
        >
            <MapContainer
                center={lastPosition}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                className="rounded-none overflow-hidden shadow-lg"
            >
                <TileLayer
                    key={currentLayer.name} // Key changes to force re-render when layer URL changes
                    attribution={currentLayer.attribution}
                    url={currentLayer.url}
                />

                {isActive && homeLocation && homeLocation[0] && homeLocation[1] && (
                    <>
                        <Marker position={homeLocation} icon={homeIcon}>
                            <Tooltip
                                direction="top"
                                offset={[0, -10]}
                                className="p-1 rounded shadow"
                                style={{
                                    backgroundColor: currentStyles.tooltipBg,
                                    color: currentStyles.homeTooltipText,
                                    border: currentStyles.tooltipBorder,
                                }}
                            >
                                Home
                            </Tooltip>
                        </Marker>

                        {geoFenceRadius > 0 && (
                            <Circle
                                center={homeLocation}
                                radius={geoFenceRadius}
                                pathOptions={{
                                    color: currentStyles.homeIconSvg, // Use same color as home icon for consistency
                                    fillColor: currentStyles.homeIconSvg,
                                    fillOpacity: 0.1,
                                    weight: 2,
                                    dashArray: '5, 10'
                                }}
                            >
                                <Tooltip
                                    direction="top"
                                    className="p-1 rounded shadow"
                                    style={{
                                        backgroundColor: currentStyles.tooltipBg,
                                        color: currentStyles.homeTooltipText,
                                        border: currentStyles.tooltipBorder,
                                    }}
                                >
                                    Geofence: {geoFenceRadius}m radius
                                </Tooltip>
                            </Circle>
                        )}
                    </>
                )}

                {latest && (
                    <>
                        <Marker position={latest} icon={deviceIcon}>
                            <Tooltip
                                permanent
                                direction="top"
                                offset={[0, -20]}
                                className="p-1 rounded shadow"
                                style={{
                                    backgroundColor: currentStyles.tooltipBg,
                                    color: currentStyles.tooltipText,
                                    border: currentStyles.tooltipBorder,
                                }}
                            >
                                Stationary
                            </Tooltip>
                        </Marker>
                        <CircleMarker
                            center={latest}
                            radius={8}
                            fillColor="#3b82f6" // This color is hardcoded (blue-500), consider making it themeable if needed
                            fillOpacity={0.3}
                            color="#3b82f6" // Hardcoded, same as above
                            weight={2}
                        />
                        <MapController
                            onMapReady={handleMapReady}
                            shouldCenterMap={shouldCenterMap}
                            onCentered={handleCentered}
                            followDevice={followDevice}
                            position={latest}
                        />
                        <LayerController currentLayer={currentLayer} />
                    </>
                )}
                {path.length > 1 && (
                    <Polyline positions={path} color="#3b82f6" weight={3} opacity={0.8} dashArray="6,10" />
                )}
            </MapContainer>

            {/* Controls */}
            <MapControls
                onCenterMap={handleCenterMap}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onToggleFullscreen={toggleFullscreen}
                onToggleFollow={toggleFollow}
                isFollowing={followDevice} // PASS THE PROP HERE
                commonButtonStyles={commonButtonStyles} // PASS THE PROP HERE
                commonButtonHoverStyles={commonButtonHoverStyles} // PASS THE PROP HERE
                currentStyles={currentStyles} // PASS THE PROP HERE
            />

            {/* Layer Switch Button */}
            <div className="absolute top-4 left-4 z-[1000]">
                <button
                    onClick={cycleMapLayer}
                    className="flex items-center gap-2 px-3 py-2 rounded-md shadow backdrop-blur-md"
                    style={commonButtonStyles}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = commonButtonHoverStyles.boxShadow}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = commonButtonStyles.boxShadow}
                >
                    <Layers className="w-4 h-4" style={{ color: currentStyles.brandIconColor }} />
                    {currentLayer.name}
                </button>
            </div>

            {/* Last Updated Info */}
            <div
                className="absolute bottom-6 left-4 px-3 py-2 rounded shadow-md z-[1000] text-xs"
                style={{
                    backgroundColor: currentStyles.infoBoxBg,
                    color: currentStyles.infoBoxText,
                    border: currentStyles.infoBoxBorder,
                }}
            >
                Last updated: <span className="font-semibold" style={{ color: currentStyles.infoBoxHighlightText }}>
                    {deviceDetails?.timestamp
                        ? new Date(deviceDetails.timestamp).toLocaleString()
                        : 'Loading...'}
                </span>
            </div>
            {/* <div
                className="absolute bottom-16 left-4 px-3 py-2 rounded shadow-md z-[1000] text-xs"
                style={{
                    backgroundColor: currentStyles.infoBoxBg,
                    color: currentStyles.infoBoxText,
                    border: currentStyles.infoBoxBorder,
                }}
            >
                Speed: <span className="font-semibold" style={{ color: currentStyles.infoBoxHighlightText }}>
                    {telemetry?.deviceSpeed
                        ? `${telemetry.deviceSpeed} km/h`
                        : 'Loading...'}
                </span>
            </div> */}

            {/* Exit Fullscreen Button */}
            {isFullscreen && (
                <button
                    onClick={toggleFullscreen}
                    className="absolute top-4 right-4 p-2 rounded-full shadow backdrop-blur-md"
                    style={commonButtonStyles}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = commonButtonHoverStyles.boxShadow}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = commonButtonStyles.boxShadow}
                    title="Exit Fullscreen"
                >
                    <Minimize className="w-5 h-5" style={{ color: currentStyles.brandIconColor }} />
                </button>
            )}
        </div>
    );
}