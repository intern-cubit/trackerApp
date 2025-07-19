import {
    User,
    Bell,
    CreditCard,
    LogOut,
    Key,
    ChevronLeft,
    Sun,
    Moon
} from "lucide-react";
import { toggleTheme } from "../../features/themeSlice";
import { useDispatch, useSelector } from "react-redux";
import { setAdmin, setAuth } from "../../features/authSlice";
import { useNavigate } from "react-router-dom";

// NavButton component
const NavButton = ({ icon, label, tab, activeTab, setActiveTab, setMobileMenuOpen }) => {
    // Get the current theme mode to apply direct conditional styling if needed,
    // although dark: prefixes handle most of it.
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');

    return (
        <button
            onClick={() => {
                setActiveTab(tab);
                setMobileMenuOpen(false); // Close mobile menu on item click
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
            ${activeTab === tab
                ? // Active state: light mode (gray-200/50, text-indigo-700), dark mode (indigo-900/50, text-white)
                  // The image shows light mode active tab is more white-ish with indigo text
                  isDarkMode
                    ? "bg-indigo-900/50 text-white shadow-lg shadow-indigo-900/20"
                    : "bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100"
                : // Inactive state: light mode (text-gray-600, hover:bg-gray-100), dark mode (text-gray-300, hover:bg-gray-800/70)
                  isDarkMode
                    ? "text-gray-300 hover:bg-gray-800/70 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

const MenuItems = ({ activeTab, setActiveTab, setMobileMenuOpen }) => {
    const dispatch = useDispatch();
    const mode = useSelector((state) => state.theme.mode); // Get the current theme mode
    const navigate = useNavigate();

    const handleLogOut = () => {
        localStorage.clear(); // Clears all localStorage for security
        dispatch(setAuth(false));
        dispatch(setAdmin(false)); // Assuming setAdmin is relevant for your app's auth flow
        navigate("/login");
    };

    return (
        <>
            <div className="p-4 space-y-2"> {/* Added p-4 to give some padding to the container */}
                {/* Back to Dashboard Button */}
                <button
                    onClick={() => navigate("/dashboard")} // Changed to navigate to dashboard
                    className="flex items-center space-x-2 p-3 w-full text-left rounded-lg transition-colors duration-200
                               text-gray-600 hover:text-gray-800 hover:bg-gray-100
                               dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                >
                    <ChevronLeft size={16} />
                    <span>Back to Dashboard</span>
                </button>

                {/* Settings Category Title */}
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider
                              text-gray-500 dark:text-gray-400">
                    Settings
                </p>

                {/* Navigation Buttons */}
                <NavButton
                    icon={<User size={18} />}
                    label="Profile"
                    tab="profile"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setMobileMenuOpen={setMobileMenuOpen}
                />
                <NavButton
                    icon={<Key size={18} />}
                    label="Password"
                    tab="password"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setMobileMenuOpen={setMobileMenuOpen}
                />
                <NavButton
                    icon={<Bell size={18} />}
                    label="Notifications"
                    tab="notifications"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setMobileMenuOpen={setMobileMenuOpen}
                />
                <NavButton
                    icon={<CreditCard size={18} />}
                    label="Payments"
                    tab="payments"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    setMobileMenuOpen={setMobileMenuOpen}
                />

                {/* Separator and Bottom Buttons (Theme Toggle, Log Out) */}
                <div className="border-t pt-4 space-y-2
                                border-gray-200 dark:border-gray-700"> {/* Light mode border: gray-200 */}
                    {/* Theme Toggle Button */}
                    <button
                        onClick={() => dispatch(toggleTheme())}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                                   text-gray-600 hover:bg-gray-100 hover:text-gray-800
                                   dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    >
                        {mode === 'dark'
                            ? <Sun size={18} className="text-yellow-400" />
                            : <Moon size={18} className="text-blue-500" /> /* Brighter blue for moon in light mode */}
                        <span>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    {/* Log Out Button */}
                    <button
                        onClick={handleLogOut}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                                   text-red-600 hover:bg-red-50 hover:text-red-800
                                   dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                    >
                        <LogOut size={18} />
                        <span>Log Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default MenuItems;