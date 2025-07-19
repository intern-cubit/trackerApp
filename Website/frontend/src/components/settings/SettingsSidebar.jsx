import {
    User,
    Menu,
    X as XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import MenuItems from "./MenuItems"; // Assuming MenuItems handles its own dark mode

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
    const reduxUser = useSelector((state) => state.auth.user);
    // Get the current theme mode from Redux - though not directly used for conditional classes here, it's good practice to be aware
    const isDarkMode = useSelector(state => state.theme.mode === 'dark');

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        const stored = reduxUser || JSON.parse(localStorage.getItem("user") || "{}");
        setFullName(stored?.fullName || "");
        setEmail(stored?.email || "");
    }, [reduxUser]);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <>
            {/* Mobile Header (for toggling sidebar on small screens) */}
            <div className="md:hidden flex items-center justify-between p-4 border-b
                            bg-white/80 backdrop-blur-md sticky top-0 z-20
                            border-gray-200 dark:border-gray-800 dark:bg-gray-900/80">
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500">TrackLink</h1>
                <button
                    onClick={toggleMobileMenu}
                    className="p-2 rounded-lg transition-colors
                               bg-gray-100 hover:bg-gray-200 text-gray-700
                               dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                >
                    {mobileMenuOpen ? <XIcon size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile Menu Overlay (appears when mobileMenuOpen is true) */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 dark:bg-black/90 z-10 pt-20 px-4">
                    <div className="rounded-lg border overflow-hidden
                                    bg-white border-gray-200
                                    dark:bg-gray-900 dark:border-gray-800">
                        {/* User Info in Mobile Menu */}
                        <div className="p-4 border-b flex items-center space-x-3
                                        border-gray-200 dark:border-gray-800">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center
                                            bg-indigo-100 dark:bg-indigo-900">
                                <User className="text-indigo-700 dark:text-white" size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white">{fullName}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{email}</p>
                            </div>
                        </div>
                        {/* Menu Items for Mobile */}
                        <MenuItems activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
                    </div>
                </div>
            )}

            {/* Left Sidebar - Desktop (hidden on small screens) */}
            <div className="hidden md:flex w-72 lg:w-80 border-r flex-col h-screen sticky top-0
                            bg-white border-gray-200 // Light mode defaults
                            dark:bg-gray-900/30 dark:border-gray-800 dark:backdrop-blur-sm">
                {/* Logo/App Name */}
                <div className="p-4 border-b
                                border-gray-200 dark:border-gray-800">
                    <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500">TrackLink</h1>
                </div>

                {/* User Info in Desktop Sidebar */}
                <div className="p-4 flex items-center space-x-3 border-b
                                border-gray-200 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center
                                    bg-indigo-100 dark:bg-indigo-900">
                        <User className="text-indigo-700 dark:text-white" size={20} />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{fullName}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{email}</p>
                    </div>
                </div>

                {/* Menu Items for Desktop */}
                <div className="flex-1 overflow-y-auto">
                    <MenuItems activeTab={activeTab} setActiveTab={setActiveTab} setMobileMenuOpen={setMobileMenuOpen} />
                </div>
            </div>
        </>
    );
};

export default SettingsSidebar;