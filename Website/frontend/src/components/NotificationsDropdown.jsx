// File: frontend/src/components/NotificationsDropdown.jsx
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { useSelector } from 'react-redux';

const NotificationsDropdown = ({ visible }) => {
    const { items, loading, unreadCount } = useSelector(s => s.notifications);

    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    // Define styles for light mode
    const lightStyles = {
        dropdown: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)', // Lighter background
            backdropFilter: 'blur(8px)',
            border: '1px solid #d1d5db', // Light gray border
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)', // Soft shadow
        },
        headerBorder: '1px solid #e5e7eb', // Lighter border for header
        headerText: '#374151', // Darker text for header
        unreadCountText: '#ef4444', // Red-500
        loadingText: '#9ca3af', // Gray-400
        noNotificationsText: '#9ca3af', // Gray-400
        listItemText: '#4b5563', // Gray-700
        listItemHoverBg: 'rgba(229, 231, 235, 0.7)', // Light gray hover
        listItemUnreadBg: 'rgba(243, 244, 246, 0.8)', // Lighter background for unread
        timestampText: '#6b7280', // Gray-500
    };

    // Define styles for dark mode
    const darkStyles = {
        dropdown: {
            backgroundColor: 'rgba(30,30,30,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #1f2937', // gray-800
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)', // Darker shadow
        },
        headerBorder: '1px solid #4b5563', // gray-600
        headerText: '#d1d5db', // gray-300
        unreadCountText: '#ef4444', // Red-400
        loadingText: '#9ca3af', // gray-400
        noNotificationsText: '#9ca3af', // gray-400
        listItemText: '#e5e7eb', // gray-200
        listItemHoverBg: 'rgba(48,48,48,0.7)',
        listItemUnreadBg: 'rgba(48,48,48,0.7)',
        timestampText: '#9ca3af', // gray-400
    };

    // Choose the current styles based on isDarkMode
    const currentStyles = isDarkMode ? darkStyles : lightStyles;

    return (
        <div
            className={`
                custom-scrollbar absolute top-14 right-4 w-80 max-h-96 overflow-y-auto rounded-md z-50
                transition-opacity duration-200
                ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}
            style={currentStyles.dropdown}
        >
            <div
                className="p-3 font-semibold"
                style={{ borderBottom: currentStyles.headerBorder, color: currentStyles.headerText }}
            >
                Notifications
                {unreadCount > 0 && (
                    <span className="ml-2 text-sm" style={{ color: currentStyles.unreadCountText }}>
                        ({unreadCount} new)
                    </span>
                )}
            </div>

            {loading ? (
                <div className="p-4 text-center" style={{ color: currentStyles.loadingText }}>
                    Loading…
                </div>
            ) : items.length === 0 ? (
                <div className="p-4 text-center" style={{ color: currentStyles.noNotificationsText }}>
                    No notifications
                </div>
            ) : (
                <ul>
                    {items.map((n, idx) => (
                        <li
                            key={idx}
                            className={`px-4 py-2 text-sm`}
                            style={{
                                color: currentStyles.listItemText,
                                backgroundColor: !n.read ? currentStyles.listItemUnreadBg : 'transparent',
                                transition: 'background-color 0.2s', // Add transition for hover effect
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = currentStyles.listItemHoverBg;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = !n.read ? currentStyles.listItemUnreadBg : 'transparent';
                            }}
                        >
                            <div>{n.message}</div>
                            <div className="text-xs mt-1" style={{ color: currentStyles.timestampText }}>
                                {new Date(n.timestamp).toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NotificationsDropdown;