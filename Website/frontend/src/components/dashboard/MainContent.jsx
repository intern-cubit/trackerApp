import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification, fetchNotifications, markAllReadOnServer } from '../../features/notificationSlice';
import NotificationsDropdown from '../NotificationsDropdown';
import io from 'socket.io-client';
import LiveTrackerMap from '../LiveTrackerMap';
import LocationHistoryMap from '../LocationHistoryMap';
import SecurityPanel from '../SecurityPanel';
import Bottombar from './Bottombar';
import { Link } from 'react-router-dom';

const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000", {
    auth: { token: localStorage.getItem('token') }
});

const MainContent = ({ tab, setTab, selectedDevice, selectedTrackerId, path, latest, deviceDetails }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const prevOpenRef = useRef(false);
    const dispatch = useDispatch();
    const user = useSelector(state => state.auth.user); // Ensure user is correctly retrieved
    const { unreadCount } = useSelector(state => state.notifications);

    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    useEffect(() => {
        dispatch(fetchNotifications());
    }, [dispatch]);

    useEffect(() => {
        socket.on('connect_error', err => console.error('Socket auth error', err));
        socket.on('alertNotification', data => dispatch(addNotification(data)));
        return () => {
            socket.off('alertNotification');
        };
    }, [dispatch]);

    useEffect(() => {
        if (prevOpenRef.current === true && dropdownOpen === false) {
            dispatch(markAllReadOnServer());
        }
        prevOpenRef.current = dropdownOpen;
    }, [dropdownOpen, dispatch]);

    // Define styles for light mode
    const lightStyles = {
        mainBackground: {
            background: 'linear-gradient(to bottom right, #e0e7ff, #ffffff, #eef2ff)',
        },
        headerDiv: {
            borderBottom: '1px solid #c3dafe',
        },
        headerTextPrimary: {
            color: '#374151', // gray-700
        },
        headerTextSecondary: {
            color: '#6b7280', // gray-500
        },
        buttonBg: 'rgba(255, 255, 255, 0.8)',
        buttonBorder: '1px solid #d1d5db',
        buttonText: '#6b7280', // gray-500
        buttonHoverText: '#4f46e5', // blue-400
        mapPlaceholderBg: '#f0f2f5', // light background for map placeholders
        mapPlaceholderText: '#9ca3af', // gray-400
        userProfileBorder: '1px solid #4f46e5', // indigo-600
    };

    // Define styles for dark mode
    const darkStyles = {
        mainBackground: {
            background: 'linear-gradient(to bottom right, #111827, #000000, #10151b)',
        },
        headerDiv: {
            borderBottom: '1px solid #1f2937', // gray-800
        },
        headerTextPrimary: {
            color: '#d1d5db', // gray-300
        },
        headerTextSecondary: {
            color: '#9ca3af', // gray-400
        },
        buttonBg: 'rgba(30,30,30,0.5)',
        buttonBorder: '1px solid #1f2937', // gray-800
        buttonText: '#d1d5db', // gray-300
        buttonHoverText: '#60a5fa', // blue-400
        mapPlaceholderBg: '#0d1117', // dark background for map placeholders
        mapPlaceholderText: '#9ca3af', // gray-500
        userProfileBorder: '1px solid #4f46e5', // indigo-600
    };

    const currentStyles = isDarkMode ? darkStyles : lightStyles;

    const commonButtonStyles = {
        backgroundColor: currentStyles.buttonBg,
        border: currentStyles.buttonBorder,
        color: currentStyles.buttonText,
        transition: 'color 0.2s ease-in-out',
    };

    return (
        <main
            className="flex-1 flex flex-col relative overflow-hidden"
            style={currentStyles.mainBackground}
        >
            <div
                className="hidden md:flex items-center justify-between px-4 py-3 shadow-md"
                style={currentStyles.headerDiv}
            >
                <div className="flex items-center gap-2">
                    <h3 className="font-medium" style={currentStyles.headerTextPrimary}>
                        {tab === 'live' ? 'Live Tracking' : tab === 'history' ? 'Location History' : 'Security & Remote Control'}
                    </h3>
                    {selectedDevice && (
                        <span className="text-sm" style={currentStyles.headerTextSecondary}>
                            • {selectedDevice.tracker.device.deviceName} ({selectedDevice.tracker.deviceId})
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4 relative">
                    <button
                        onClick={() => setDropdownOpen(o => !o)}
                        className="rounded-full p-2 relative"
                        style={commonButtonStyles}
                        onMouseEnter={(e) => e.currentTarget.style.color = currentStyles.buttonHoverText}
                        onMouseLeave={(e) => e.currentTarget.style.color = currentStyles.buttonText}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <Link
                        to={"/settings"}
                        className={`rounded-full ${(!user?.profilePic) ? 'p-2' : ''}`}
                        style={{
                            ...commonButtonStyles,
                            padding: user?.profilePic ? '0' : '8px', // Adjust padding based on profilePic
                        }}
                        onMouseEnter={(e) => {
                            if (!user?.profilePic) { // Only change icon color on hover if no profile pic
                                e.currentTarget.style.color = currentStyles.buttonHoverText;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!user?.profilePic) {
                                e.currentTarget.style.color = currentStyles.buttonText;
                            }
                        }}
                    >
                        {user?.profilePic ?
                            <img
                                src={user.profilePic || ""}
                                alt='user profile'
                                className='w-9 h-9 object-cover rounded-full border-1'
                                style={{ borderColor: currentStyles.userProfileBorder }}
                            />
                            :
                            <User className="w-5 h-5" />
                        }
                    </Link>

                    <NotificationsDropdown visible={dropdownOpen} />
                </div>
            </div>

            <div className="flex-1 relative sm:pb-16 md:pb-0">
                {tab === 'live' ? (
                    <div className="h-full absolute inset-0 bottom-16 md:bottom-0">
                        <LiveTrackerMap selectedDevice={selectedDevice} path={path} latest={latest} deviceDetails={deviceDetails} />
                    </div>
                ) : tab === 'security' ? (
                    <div className="h-full absolute inset-0 bottom-16 md:bottom-0 overflow-auto p-4">
                        <SecurityPanel selectedDevice={selectedDevice} />
                    </div>
                ) : selectedTrackerId ? (
                    <div className="h-full absolute inset-0 bottom-16 md:bottom-0">
                        <LocationHistoryMap trackerId={selectedTrackerId} />
                    </div>
                ) : (
                    <div
                        className="flex items-center justify-center h-full text-center px-4 absolute inset-0 bottom-16 md:bottom-0"
                        style={{
                            backgroundColor: currentStyles.mapPlaceholderBg,
                            color: currentStyles.mapPlaceholderText
                        }}
                    >
                        Select a device to view {tab === 'live' ? 'live tracking' : tab === 'history' ? 'location history' : 'security controls'}
                    </div>
                )}
                <Bottombar selectedDevice={selectedDevice} setTab={setTab} tab={tab} />
            </div>
        </main>
    );
};

export default MainContent;