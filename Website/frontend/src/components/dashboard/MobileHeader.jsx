import { Menu, Bell, Settings, User } from 'lucide-react';
import { useState, useEffect } from 'react'; // Import useEffect for initial check
import NotificationsDropdown from '../NotificationsDropdown';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const MobileHeader = ({ setSidebarOpen }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { unreadCount } = useSelector(state => state.notifications);
    const user = useSelector(state => state.auth.user || localStorage.getItem("user"));

    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');

    // Define styles for light mode
    const lightStyles = {
        header: {
            background: 'linear-gradient(to bottom right, #e0e7ff, #ffffff, #eef2ff)',
            borderBottom: '1px solid #c3dafe',
        },
        textPrimary: {
            color: '#374151',
        },
        textBrand: {
            color: '#4f46e5',
        },
        icon: {
            color: '#6b7280',
        },
        iconHover: {
            color: '#4f46e5',
        },
        button: {
            backgroundColor: '#ffffff',
            border: '1px solid #d1d5db',
            boxShadow: '0 0 0 rgba(0,0,0,0)', // Default no shadow for light
        },
        buttonHoverShadow: '0 0 15px rgba(79, 70, 229, 0.2)', // Light theme hover shadow
    };

    // Define styles for dark mode
    const darkStyles = {
        header: {
            background: 'linear-gradient(to bottom right, #111827, #000000, #10151b)',
            borderBottom: '1px solid #1f2937',
        },
        textPrimary: {
            color: '#d1d5db',
        },
        textBrand: {
            color: '#60a5fa',
        },
        icon: {
            color: '#9ca3af',
        },
        iconHover: {
            color: '#60a5fa',
        },
        button: {
            backgroundColor: 'rgba(30, 30, 30, 0.5)',
            border: '1px solid #1f2937',
            boxShadow: '0 0 0 rgba(0,0,0,0)', // Default no shadow for dark
        },
        buttonHoverShadow: '0 0 15px rgba(106, 90, 205, 0.3)', // Dark theme hover shadow
    };

    // Choose the current styles based on isDarkMode
    const currentStyles = isDarkMode ? darkStyles : lightStyles;

    return (
        <header
            className="md:hidden flex items-center justify-between p-3 shadow-md"
            style={currentStyles.header}
        >
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="focus:outline-none transition-colors duration-200"
                    style={{
                        ...currentStyles.icon, // Apply base icon color
                        transition: 'color 0.2s ease-in-out', // Ensure smooth transition
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = currentStyles.iconHover.color}
                    onMouseLeave={(e) => e.currentTarget.style.color = currentStyles.icon.color}
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold" style={currentStyles.textBrand}>TrackLink</h2>
            </div>
            <div className="relative flex items-center gap-3">
                <button
                    onClick={() => setDropdownOpen(o => !o)}
                    className="backdrop-blur-md rounded-full p-2 relative transition-all duration-300"
                    style={currentStyles.button}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = currentStyles.iconHover.color;
                        e.currentTarget.style.boxShadow = currentStyles.buttonHoverShadow;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = currentStyles.icon.color;
                        e.currentTarget.style.boxShadow = currentStyles.button.boxShadow;
                    }}
                >
                    <Bell className="w-5 h-5" style={currentStyles.icon} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>
                <Link
                    to={"/settings"}
                    className={`backdrop-blur-md rounded-full transition-all duration-300`}
                    style={{
                        ...currentStyles.button,
                        padding: user?.profilePic ? '0' : '8px', // Adjust padding based on profilePic
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = currentStyles.iconHover.color;
                        e.currentTarget.style.boxShadow = currentStyles.buttonHoverShadow;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = currentStyles.icon.color;
                        e.currentTarget.style.boxShadow = currentStyles.button.boxShadow;
                    }}
                >
                    {user?.profilePic ?
                        <img src={user.profilePic || ""} alt='user profile' className='w-9 h-9 object-cover rounded-full border-1 border-indigo-600' />
                        :
                        <User className="w-5 h-5" style={currentStyles.icon} />
                    }
                </Link>

                <NotificationsDropdown visible={dropdownOpen} />

            </div>
        </header>
    );
};

export default MobileHeader;