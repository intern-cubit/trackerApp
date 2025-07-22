import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { History, MapPin, Battery, Shield } from 'lucide-react';
import { useSelector } from 'react-redux';

const Bottombar = ({ selectedDevice, setTab, tab }) => {
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');


    // Define styles for light mode
    const lightStyles = {
        bottombar: {
            background: 'linear-gradient(to bottom right, #e0e7ff, #ffffff, #eef2ff)',
            borderTop: '1px solid #c3dafe',
        },
        tabIconColor: '#6b7280', // Gray for inactive icons
        tabIconHoverColor: '#4f46e5', // Indigo for icon hover
        tabActiveIconColor: '#4f46e5', // Indigo for active icon
        tabTextColor: '#6b7280', // Gray for inactive text
        tabActiveTextColor: '#4f46e5', // Indigo for active text
        tabActiveBg: '#ffffff', // White for active tab background
        tabActiveBorder: '1px solid #d1d5db', // Light gray for active tab border
        tabActiveShadow: '0 0 15px rgba(79, 70, 229, 0.2)', // Light theme shadow for active tab
    };

    // Define styles for dark mode
    const darkStyles = {
        bottombar: {
            background: 'linear-gradient(to bottom right, #111827, #000000, #10151b)',
            borderTop: '1px solid #1f2937',
        },
        tabIconColor: '#9ca3af', // Lighter gray for inactive icons
        tabIconHoverColor: '#60a5fa', // Light blue for icon hover
        tabActiveIconColor: '#60a5fa', // Light blue for active icon
        tabTextColor: '#9ca3af', // Lighter gray for inactive text
        tabActiveTextColor: '#60a5fa', // Light blue for active text
        tabActiveBg: 'rgba(30,30,30,0.5)',
        tabActiveBorder: '1px solid #1f2937',
        tabActiveShadow: '0 0 15px rgba(106,90,205,0.3)', // Dark theme shadow for active tab
    };

    // Choose the current styles based on isDarkMode
    const currentStyles = isDarkMode ? darkStyles : lightStyles;

    // Helper function to get tab styles
    const getTabStyles = (currentTab) => {
        const isActive = tab === currentTab;
        return {
            iconContainer: {
                padding: '8px',
                borderRadius: '9999px', // full rounded
                transition: 'background-color 0.3s, border 0.3s, box-shadow 0.3s',
                ...(isActive && {
                    backgroundColor: currentStyles.tabActiveBg,
                    border: currentStyles.tabActiveBorder,
                    boxShadow: currentStyles.tabActiveShadow,
                }),
            },
            icon: {
                width: '16px', // w-4
                height: '16px', // h-4
                color: isActive ? currentStyles.tabActiveIconColor : currentStyles.tabIconColor,
                transition: 'color 0.3s',
            },
            text: {
                fontSize: '0.75rem', // text-xs
                marginTop: '0.25rem', // mt-1
                color: isActive ? currentStyles.tabActiveTextColor : currentStyles.tabTextColor,
                transition: 'color 0.3s',
            },
            button: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px',
                transition: 'color 0.3s',
            }
        };
    };

    return (
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-10 shadow-lg flex items-center justify-around p-2"
            style={currentStyles.bottombar}
        >
            <button
                onClick={() => setTab('live')}
                style={getTabStyles('live').button}
                onMouseEnter={(e) => {
                    if (tab !== 'live') { // Only change color on hover if not active
                        e.currentTarget.querySelector('svg').style.color = currentStyles.tabIconHoverColor;
                        e.currentTarget.querySelector('span').style.color = currentStyles.tabIconHoverColor;
                    }
                }}
                onMouseLeave={(e) => {
                    if (tab !== 'live') {
                        e.currentTarget.querySelector('svg').style.color = currentStyles.tabIconColor;
                        e.currentTarget.querySelector('span').style.color = currentStyles.tabTextColor;
                    }
                }}
            >
                <div style={getTabStyles('live').iconContainer}>
                    <MapPin style={getTabStyles('live').icon} />
                </div>
                <span style={getTabStyles('live').text}>Live</span>
            </button>

            <button
                onClick={() => setTab('history')}
                style={getTabStyles('history').button}
                onMouseEnter={(e) => {
                    if (tab !== 'history') { // Only change color on hover if not active
                        e.currentTarget.querySelector('svg').style.color = currentStyles.tabIconHoverColor;
                        e.currentTarget.querySelector('span').style.color = currentStyles.tabIconHoverColor;
                    }
                }}
                onMouseLeave={(e) => {
                    if (tab !== 'history') {
                        e.currentTarget.querySelector('svg').style.color = currentStyles.tabIconColor;
                        e.currentTarget.querySelector('span').style.color = currentStyles.tabTextColor;
                    }
                }}
            >
                <div style={getTabStyles('history').iconContainer}>
                    <History style={getTabStyles('history').icon} />
                </div>
                <span style={getTabStyles('history').text}>History</span>
            </button>

            <button
                onClick={() => setTab('security')}
                style={getTabStyles('security').button}
                onMouseEnter={(e) => {
                    if (tab !== 'security') { // Only change color on hover if not active
                        e.currentTarget.querySelector('svg').style.color = currentStyles.tabIconHoverColor;
                        e.currentTarget.querySelector('span').style.color = currentStyles.tabIconHoverColor;
                    }
                }}
                onMouseLeave={(e) => {
                    if (tab !== 'security') {
                        e.currentTarget.querySelector('svg').style.color = currentStyles.tabIconColor;
                        e.currentTarget.querySelector('span').style.color = currentStyles.tabTextColor;
                    }
                }}
            >
                <div style={getTabStyles('security').iconContainer}>
                    <Shield style={getTabStyles('security').icon} />
                </div>
                <span style={getTabStyles('security').text}>Security</span>
            </button>

            {selectedDevice && (
                <div
                    className="flex flex-col items-center p-2"
                    style={{ ...getTabStyles('').button, color: currentStyles.tabTextColor }} // Apply general button styles for alignment
                >
                    <div style={getTabStyles('').iconContainer}>
                        <Battery style={getTabStyles('').icon} />
                    </div>
                    <span style={getTabStyles('').text}>75%</span>
                </div>
            )}
        </div>
    );
};

export default Bottombar;