import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X } from 'lucide-react';
import {
    MapContainer,
    TileLayer,
    Polyline,
    Marker,
    Popup,
    useMap,
    CircleMarker,
    ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationHistory } from '../hooks/useLocationHistory';
import { Calendar, Clock, Battery, Info, Layers, Navigation, ArrowLeft, ArrowRight, Play, Pause, List, Download, Maximize, Minimize } from 'lucide-react';
import RoutingMachine from './RoutingMachine';

// Patch Leaflet's default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
});

// Helper: SVG marker icon with custom color
const createColoredLocationIcon = (color) => {
    const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 22.2 12.5 41 12.5 41S25 22.2 25 12.5C25 5.6 19.4 0 12.5 0zM12.5 18.8c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" fill="${color}"/>
        </svg>
    `;
    const encoded = encodeURIComponent(svgIcon)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22");
    const iconUrl = `data:image/svg+xml,${encoded}`;

    return new L.Icon({
        iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -41],
        shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        shadowSize: [41, 41],
    });
};

const createTriangleIcon = () => {
    const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 60 60">
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
            </defs>
            <g transform="translate(30,30) rotate(0) translate(-30,-30)">
                <polygon 
                    points="30,5 55,55 30,45 5,55" 
                    fill="white" 
                    stroke="#4285F4" 
                    stroke-width="4" 
                    filter="url(#shadow)" />
            </g>
        </svg>
    `;
    
    const encoded = encodeURIComponent(svgIcon)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22");

    const iconUrl = `data:image/svg+xml,${encoded}`;

    return new L.Icon({
        iconUrl,
        iconSize: [35, 35],
        iconAnchor: [17.5, 17.5],
        popupAnchor: [0, -17.5],
        className: 'triangle-icon'
    });
};

// Map resize handler
function ResizeHandler() {
    const map = useMap();
    useEffect(() => {
        const onResize = () => map.invalidateSize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [map]);
    return null;
}

// Utility: Convert date to start and end of day
const startOfDay = (date) => new Date(date.setHours(0, 0, 0, 0));
const endOfDay = (date) => new Date(date.setHours(23, 59, 59, 999));

// Convert timestamp to formatted time
const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function LocationHistoryMap({ trackerId }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [from, setFrom] = useState(startOfDay(new Date()));
    const [to, setTo] = useState(endOfDay(new Date()));
    const [mapRef, setMapRef] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [playback, setPlayback] = useState(false);
    const [activePointIndex, setActivePointIndex] = useState(0);
    const [showRawData, setShowRawData] = useState(false);
    const [mapLayer, setMapLayer] = useState({
        name: 'Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; Carto'
    });

    // Fetch location history data
    const { history, loading, error } = useLocationHistory(trackerId, from, to);

    // Extract positions from history for the map
    const positions = history.map(({ latitude, longitude }) => [latitude, longitude]);

    // Define marker icons with colors matching the dark theme
    const startIcon = createColoredLocationIcon('green'); // Purple for start point (matches theme)
    const endIcon = createColoredLocationIcon('#FF4500');   // OrangeRed for end point
    const activeIcon = createTriangleIcon('#00BFFF'); // DeepSkyBlue for active point

    // Toggle map layer
    const cycleMapLayer = () => {
        const layers = [
            {
                name: 'Satellite',
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            },
            {
                name: 'Standard',
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '&copy; OpenStreetMap contributors'
            },
            {
                name: 'Dark',
                url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                attribution: '&copy; OpenStreetMap contributors &copy; Carto'
            },
        ];

        const currentIndex = layers.findIndex(layer => layer.name === mapLayer.name);
        const nextIndex = (currentIndex + 1) % layers.length;
        setMapLayer(layers[nextIndex]);
    };

    // Handle playback animation
    useEffect(() => {
        let interval;
        if (playback && history.length > 0) {
            interval = setInterval(() => {
                setActivePointIndex((prevIndex) => {
                    const nextIndex = prevIndex + 1;
                    if (nextIndex >= history.length) {
                        setPlayback(false);
                        return 0;
                    }

                    // Center map on the active point
                    if (mapRef) {
                        const point = history[nextIndex];
                        mapRef.setView([point.latitude, point.longitude], mapRef.getZoom(), {
                            animate: true
                        });
                    }

                    return nextIndex;
                });
            }, 1000); // Move to next point every second
        }

        return () => clearInterval(interval);
    }, [playback, history, mapRef]);

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        // Allow the resize to complete before invalidating map size
        setTimeout(() => {
            if (mapRef) {
                mapRef.invalidateSize();
            }
        }, 100);
    };

    // Navigation controls for playback
    const handlePrevPoint = () => {
        if (activePointIndex > 0) {
            const newIndex = activePointIndex - 1;
            setActivePointIndex(newIndex);

            if (mapRef && history[newIndex]) {
                const point = history[newIndex];
                mapRef.setView([point.latitude, point.longitude], mapRef.getZoom(), {
                    animate: true
                });
            }
        }
    };

    const handleNextPoint = () => {
        if (activePointIndex < history.length - 1) {
            const newIndex = activePointIndex + 1;
            setActivePointIndex(newIndex);

            if (mapRef && history[newIndex]) {
                const point = history[newIndex];
                mapRef.setView([point.latitude, point.longitude], mapRef.getZoom(), {
                    animate: true
                });
            }
        }
    };

    // Download history data as CSV
    const downloadCSV = () => {
        if (history.length === 0) return;

        const headers = "Timestamp,Latitude,Longitude,Battery,Main\n";
        const csvData = history.map(point =>
            `${new Date(point.timestamp).toISOString()},${point.latitude},${point.longitude},${point.battery},${point.main}`
        ).join("\n");

        const blob = new Blob([headers + csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = selectedDate.toISOString().split('T')[0];
        a.setAttribute('download', `location-history-${date}.csv`);
        a.setAttribute('href', url);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className={`relative ${isFullscreen ? 'fixed inset-0 bg-black' : 'h-full w-full'}`}>
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-gradient-to-br from-gray-900 via-black to-gray-900 bg-opacity-50 backdrop-blur-md border border-gray-800 p-2 rounded-md shadow-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]">
                <Calendar className="w-4 h-4 text-purple-400" />
                <DatePicker
                    selected={selectedDate}
                    onChange={(date) => {
                        setSelectedDate(date);
                        setFrom(date ? startOfDay(new Date(date)) : null);
                        setTo(date ? endOfDay(new Date(date)) : null);
                        setActivePointIndex(0);
                    }}
                    dateFormat="MMM d, yyyy"
                    className="bg-transparent border-0 text-sm p-0 w-32 focus:outline-none focus:ring-0 text-gray-200"
                />
            </div>

            <div className="absolute md:top-16 md:left-4 top-4 right-4 z-10">
                <button
                    onClick={cycleMapLayer}
                    className="bg-gradient-to-br from-gray-900 via-black to-gray-900 bg-opacity-50 backdrop-blur-md border border-gray-800 p-2 rounded-md shadow-md hover:shadow-[0_0_15px_rgba(106,90,205,0.3)] text-gray-300 flex items-center gap-2 text-sm transition-all duration-300"
                >
                    <Layers className="w-4 h-4" />
                    <span>{mapLayer.name}</span>
                </button>
            </div>

            {/* Loading and Error States */}
            {loading && (
                <div className="absolute top-16 right-4 z-10 bg-gradient-to-br from-gray-900 via-black to-gray-900 bg-opacity-50 backdrop-blur-md border border-gray-800 p-2 rounded-md shadow-md text-sm">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                        <span className="text-gray-300">Loading history...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute top-16 right-4 z-10 bg-gradient-to-br from-red-900 via-black to-gray-900 bg-opacity-50 backdrop-blur-md border border-red-800 p-2 rounded-md shadow-md text-sm text-red-400 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {/* Map Container */}
            {!selectedDate ? (
                <div className="h-full flex items-center justify-center bg-[rgba(30,30,30,0.5)] backdrop-blur-md text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-8 h-8 text-purple-400" />
                        <p>Please select a date to view location history</p>
                    </div>
                </div>
            ) : !loading && !error && positions.length > 0 ? (
                <div className="h-full -z-10">
                    <MapContainer
                        center={activeIcon ? positions[activePointIndex] : [0, 0]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        whenCreated={(map) => {
                            setMapRef(map);
                            map.invalidateSize();
                        }}
                    >
                        <ResizeHandler />
                        <TileLayer
                            attribution={mapLayer.attribution}
                            url={mapLayer.url}
                        />

                        {/* Route line */}
                        <RoutingMachine
                            waypoints={positions.map(([lat, lng]) => L.latLng(lat, lng))}
                            position="topright"
                        />

                        {/* Markers for each point */}
                        {history.map((point, idx) => {
                            const pos = [point.latitude, point.longitude];
                            const isEnd = idx === history.length - 1;
                            const isStart = idx === 0;
                            const isActive = idx === activePointIndex;

                            // Only show start, end and active markers
                            if (isStart || isEnd || isActive) {
                                let icon;
                                if (isStart) icon = startIcon;
                                else if (isEnd) icon = endIcon;
                                else if (isActive) icon = activeIcon;

                                return (
                                    <Marker key={idx} position={pos} icon={icon}>
                                        <Popup className="dark-popup">
                                            <div className="space-y-2 text-sm bg-gray-900 text-gray-300 -mx-1 -my-1 p-2 rounded">
                                                <div className="font-medium border-b border-gray-700 pb-1">
                                                    {isStart ? 'Start Point' : isEnd ? 'End Point' : 'Location Point'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-purple-400" />
                                                    <span>{new Date(point.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Battery className="w-4 h-4 text-purple-400" />
                                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className="bg-purple-500 h-2 rounded-full"
                                                            style={{ width: `${point.battery}%` }}
                                                        ></div>
                                                    </div>
                                                    <span>{point.battery}%</span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            } else {
                                // Smaller circle markers for intermediate points
                                return (
                                    <CircleMarker
                                        key={idx}
                                        center={pos}
                                        radius={4}
                                        pathOptions={{
                                            color: '#6A5ACD',
                                            fillColor: '#9F8FEF',
                                            fillOpacity: 0.7
                                        }}
                                    >
                                        <Popup>
                                            <div className="space-y-2 text-sm bg-gray-900 text-gray-300 -mx-1 -my-1 p-2 rounded">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-purple-400" />
                                                    <span>{new Date(point.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Battery className="w-4 h-4 text-purple-400" />
                                                    <span>{point.battery}%</span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            }
                        })}
                    </MapContainer>

                    {history.length > 0 && (
                        <div className="absolute md:bottom-6 bottom-20 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-10 bg-gradient-to-br from-gray-900 via-black to-gray-900 bg-opacity-50 backdrop-blur-md border border-gray-800 rounded-lg shadow-md py-2 px-4 flex items-center justify-between transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]">
                            <div className="text-sm font-medium text-gray-300">
                                {history[activePointIndex] &&
                                    formatTime(history[activePointIndex].timestamp)
                                }
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handlePrevPoint}
                                    disabled={activePointIndex === 0}
                                    className={`p-1 rounded-full ${activePointIndex === 0 ? 'text-gray-600' : 'text-gray-300 hover:bg-gray-800'}`}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => setPlayback(!playback)}
                                    className="p-1 rounded-full text-purple-400 hover:bg-gray-800"
                                >
                                    {playback ?
                                        <Pause className="w-5 h-5" /> :
                                        <Play className="w-5 h-5" />
                                    }
                                </button>

                                <button
                                    onClick={handleNextPoint}
                                    disabled={activePointIndex === history.length - 1}
                                    className={`p-1 rounded-full ${activePointIndex === history.length - 1 ? 'text-gray-600' : 'text-gray-300 hover:bg-gray-800'}`}
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowRawData(!showRawData)}
                                    className="p-1 rounded-full text-gray-300 hover:bg-gray-800"
                                    title="Show data table"
                                >
                                    <List className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={downloadCSV}
                                    className="p-1 rounded-full text-gray-300 hover:bg-gray-800"
                                    title="Download CSV"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {showRawData && history.length > 0 && (
                        <div className="absolute bottom-20 left-4 right-4 z-10 bg-gradient-to-br from-gray-900 via-black to-gray-900 bg-opacity-80 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg max-h-64 overflow-y-auto transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]">
                            <div className="sticky top-0 bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-200">Location History Data</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{history.length} points</span>
                                    <button
                                        onClick={downloadCSV}
                                        className="text-gray-400 hover:text-purple-400 p-1"
                                        title="Download CSV"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setShowRawData(false)}
                                        className="text-gray-400 hover:text-purple-400 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-800">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-3 bg-gray-900 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky top-0 border-b border-gray-800">Time</th>
                                            <th className="px-4 py-3 bg-gray-900 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky top-0 border-b border-gray-800">Coordinates</th>
                                            <th className="px-4 py-3 bg-gray-900 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky top-0 border-b border-gray-800">Battery</th>
                                            <th className="px-4 py-3 bg-gray-900 text-left text-xs font-medium text-gray-400 uppercase tracking-wider sticky top-0 border-b border-gray-800">Power Status</th>
                                            <th className="px-4 py-3 bg-gray-900 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky top-0 border-b border-gray-800">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-900 divide-y divide-gray-800">
                                        {history.map((point, idx) => (
                                            <tr
                                                key={idx}
                                                className={`hover:bg-gray-800 transition-colors ${idx === activePointIndex ? 'bg-gray-800 border-l-2 border-purple-500' : ''}`}
                                                onClick={() => {
                                                    setActivePointIndex(idx);
                                                    if (mapRef) {
                                                        mapRef.setView([point.latitude, point.longitude], mapRef.getZoom(), {
                                                            animate: true
                                                        });
                                                    }
                                                }}
                                            >
                                                <td className="px-4 py-2 whitespace-nowrap text-xs">
                                                    <div className="font-medium text-gray-300">{formatTime(point.timestamp)}</div>
                                                    <div className="text-gray-500 text-xs">{new Date(point.timestamp).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-400">
                                                    {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                                            <div
                                                                className={`h-1.5 rounded-full ${point.battery > 20 ? 'bg-purple-500' : 'bg-red-500'}`}
                                                                style={{ width: `${point.battery}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-gray-400">{point.battery}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-xs">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${point.main === 'ON' ? 'bg-purple-900 text-purple-300' : 'bg-gray-800 text-gray-400'}`}>
                                                        {point.main}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-right text-xs">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent row click
                                                            setActivePointIndex(idx); // Set this point as active
                                                            // Use a higher zoom level (16) for the focus action
                                                            if (mapRef) {
                                                                mapRef.flyTo([point.latitude, point.longitude], 16, {
                                                                    duration: 1.5 // Smooth animation
                                                                });
                                                            }
                                                        }}
                                                        className="text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-gray-800"
                                                    >
                                                        <Navigation className="w-3 h-3 inline" />
                                                        <span className="ml-1">Focus</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="py-2 px-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
                                <div>
                                    Showing all {history.length} data points
                                </div>
                                <div>
                                    <button
                                        className="text-purple-400 hover:text-purple-300"
                                        onClick={downloadCSV}
                                    >
                                        Export data
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                !loading && !error && (
                    <div className="h-full flex items-center justify-center bg-[rgba(30,30,30,0.5)] backdrop-blur-md text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                            <Info className="w-8 h-8 text-purple-400" />
                            <p className='text-center'>No location history available for the selected date</p>
                        </div>
                    </div>
                )
            )}

            {/* Custom CSS for Leaflet Popups */}
            <style jsx global>{`
                .leaflet-popup-content-wrapper, .leaflet-popup-tip {
                    background: #111827;
                    color: #d1d5db;
                    box-shadow: 0 3px 14px rgba(0,0,0,0.4);
                }
                
                /* Customize the Datepicker to match dark theme */
                .react-datepicker {
                    font-family: inherit;
                    background-color: #111827;
                    border: 1px solid #374151;
                    border-radius: 0.375rem;
                    color: #d1d5db;
                }
                
                .react-datepicker__header {
                    background-color: #1f2937;
                    border-bottom: 1px solid #374151;
                }
                
                .react-datepicker__current-month, 
                .react-datepicker__day-name {
                    color: #d1d5db;
                }
                
                .react-datepicker__day {
                    color: #d1d5db;
                }
                
                .react-datepicker__day:hover {
                    background-color: #374151;
                }
                
                .react-datepicker__day--selected, 
                .react-datepicker__day--keyboard-selected {
                    background-color: #6A5ACD;
                    color: white;
                }
                
                .react-datepicker__day--outside-month {
                    color: #6b7280;
                }
                
                .react-datepicker__triangle {
                    border-bottom-color: #111827 !important;
                }
            `}</style>
        </div>
    );
}