import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AlertCircle, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import fetchDevices from '../utils/fetchDevices';

const createCustomIcon = () => {
    return L.divIcon({
        html: '<div class="custom-pin flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full border-2 border-[#1e1e1e] shadow-md"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
};

const MapPinSelector = ({ position, setPosition, radius, shouldFly }) => {
    const markerRef = useRef(null);

    const map = useMapEvents({
        click: (e) => {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    useEffect(() => {
        if (position) {
            if (shouldFly) {
                map.flyTo(position, map.getZoom());
            } else {
                map.setView(position, map.getZoom());
            }
        }
    }, [position, map, shouldFly]);

    return position ? (
        <>
            <Marker
                position={position}
                icon={createCustomIcon()}
                ref={markerRef}
                draggable={true}
                eventHandlers={{
                    dragend: () => {
                        const marker = markerRef.current;
                        if (marker) {
                            const latlng = marker.getLatLng();
                            setPosition([latlng.lat, latlng.lng]);
                        }
                    },
                }}
            />
            {radius && (
                <Circle
                    center={position}
                    radius={Number(radius)}
                    pathOptions={{
                        fillColor: '#9333ea',
                        fillOpacity: 0.2,
                        color: '#9333ea',
                        weight: 1,
                    }}
                />
            )}
        </>
    ) : null;
};

const UpdateGeofence = ({
    setGeoFenceActive,
    setIsModalOpen,
    radiusInput: initialRadius,
    selectedTracker,
    setSelectedTracker
}) => {
    const [radiusInput, setRadiusInput] = useState(initialRadius);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [mapPosition, setMapPosition] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [shouldFly, setShouldFly] = useState(false);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    useEffect(() => {
        const geo = selectedTracker?.tracker?.geoFence;
        if (geo?.homeLatitude && geo?.homeLongitude) {
            setMapPosition([
                parseFloat(geo.homeLatitude),
                parseFloat(geo.homeLongitude)
            ]);
            setShouldFly(false); // Already has position; don't animate
        }
    }, [selectedTracker]);

    const handleShowMap = () => {
        setShowMap(true);

        // Only get current location if none exists
        if (!mapPosition) {
            setShouldFly(true); // Fly from fallback (London)
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setMapPosition([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.error('Error getting current location:', error);
                    setMapPosition([51.505, -0.09]); // Default to London
                }
            );
        }
    };

    const handleGeofenceSubmit = async () => {
        if (!radiusInput || isNaN(parseInt(radiusInput)) || parseInt(radiusInput) <= 0) {
            setErrorMessage('Please enter a valid radius (positive number)');
            return;
        }

        if (!mapPosition) {
            setErrorMessage('Please select a location on the map');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const response = await fetch(`${BACKEND_URL}/api/user/trackers/${selectedTracker?.tracker?._id}/geo-location`, {
                method: 'POST',
                headers: {
                    authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    radius: radiusInput,
                    homeLatitude: mapPosition[0],
                    homeLongitude: mapPosition[1]
                }),
            });

            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const result = await response.json();

            setSelectedTracker(prev => ({
                ...prev,
                tracker: {
                    ...prev.tracker,
                    geoFence: {
                        ...prev.tracker.geoFence,
                        isActive: true,
                        radius: `${result["geoFence.radius"]}m`,
                        homeLatitude: result["geoFence.homeLatitude"],
                        homeLongitude: result["geoFence.homeLongitude"],
                    }
                }
            }));
            setGeoFenceActive(true);
            fetchDevices();
            setTimeout(setIsModalOpen(false), 1200);
        } catch (error) {
            console.error('Error updating geofence:', error);
            setErrorMessage('Failed to update geofence. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-opacity duration-300">
            <div className="bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-[#2a2a2a] rounded-lg shadow-lg max-w-2xl w-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]">
                <div className="bg-purple-600 text-white px-4 py-3 rounded-t-lg">
                    <h3 className="font-semibold">Set Geofence Location & Radius</h3>
                </div>
                <div className="p-6">
                    {errorMessage && (
                        <div className="mb-4 bg-[#3a1a1a] text-red-300 px-3 py-2 rounded-md text-sm flex items-center border border-[#5a2828]">
                            <AlertCircle size={16} className="mr-2" />
                            {errorMessage}
                        </div>
                    )}

                    <div className="mb-4">
                        <button
                            onClick={handleShowMap}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center ${showMap ? 'hidden' : ''}`}
                        >
                            <MapPin size={16} className="mr-2" />
                            {mapPosition ? 'Change Location' : 'Select Location on Map'}
                        </button>

                        {showMap && (
                            <div className="mb-4 border border-[#2a2a2a] rounded-lg overflow-hidden" style={{ height: '300px' }}>
                                <MapContainer
                                    center={mapPosition || [51.505, -0.09]}
                                    zoom={13}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapPinSelector
                                        position={mapPosition}
                                        setPosition={setMapPosition}
                                        radius={radiusInput}
                                        shouldFly={shouldFly}
                                    />
                                </MapContainer>

                                <div className="px-3 py-2 bg-[#1a1a1a] text-xs text-[#a0a0a0]">
                                    {mapPosition ? (
                                        <span>Selected location: {mapPosition[0].toFixed(6)}, {mapPosition[1].toFixed(6)} - <i>Click to change or drag the pin</i></span>
                                    ) : (
                                        <span>Click on the map to select a location</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="radius" className="block text-sm font-medium text-[#d0d0d0] mb-1">
                            Radius (meters)
                        </label>
                        <input
                            id="radius"
                            type="number"
                            className="w-full px-3 py-2 border border-[#2a2a2a] rounded-md shadow-sm bg-[#1a1a1a] text-[#d0d0d0] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={radiusInput}
                            onChange={(e) => setRadiusInput(e.target.value)}
                            placeholder="e.g. 500"
                            min="1"
                        />
                        <p className="mt-1 text-xs text-[#a0a0a0]">
                            Enter the distance in meters that defines your geofence boundary.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-[#2a2a2a] rounded-md text-sm font-medium text-[#d0d0d0] bg-[#1a1a1a] hover:bg-[#252525] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGeofenceSubmit}
                            disabled={isSubmitting || !mapPosition}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${isSubmitting || !mapPosition ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} transition-colors`}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default UpdateGeofence;