import { useEffect, useRef, useState } from "react";
import { toast } from 'react-toastify';
import {
    User,
    Bell,
    CreditCard,
    LogOut,
    Key,
    ChevronLeft,
    Upload,
    Check,
    Mail,
    Phone,
    Save,
    Menu,
    X as XIcon,
    Pencil,
    Loader2,
    EyeOff,
    Eye,
    Sun,
    Moon
} from "lucide-react";
import { toggleTheme } from "../features/themeSlice";
import { useDispatch, useSelector } from "react-redux";
import { setAdmin, setAuth, setUser } from "../features/authSlice";
import { useNavigate } from "react-router-dom";
import { setError } from "../features/trackerSlice";

const FieldWithToggle = ({
    label, placeholder = "", value, onChange,
    show, setShow, error = false, errorMessage = ""
}) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={18} className="text-gray-500" />
                </div>
                <input
                    type={show ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={`w-full pl-10 pr-10 px-4 py-3 bg-gray-800 border ${error ? "border-red-500" : "border-gray-700"} rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner`}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                    tabIndex={-1}
                >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            {error && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                    <XIcon size={14} className="mr-1" />
                    {errorMessage}
                </p>
            )}
        </div>
    );
}


export default function SettingsPage() {
    const reduxUser = useSelector((state) => state.auth.user);
    const initialUserRef = useRef(null);
    const [activeTab, setActiveTab] = useState("profile");
    const [profileImage, setProfileImage] = useState();
    const [previewUrl, setPreviewUrl] = useState(null)
    const [notificationEmail, setNotificationEmail] = useState([false, false]);
    const [notificationSMS, setNotificationSMS] = useState([false, false]);
    const initialNotifRef = useRef({ email: notificationEmail, sms: notificationSMS });
    const [passwordMatch, setPasswordMatch] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const stored = reduxUser || JSON.parse(localStorage.getItem("user") || "{}");
        initialUserRef.current = { ...stored };
        setFullName(stored?.fullName || "");
        setUsername(stored?.username || "");
        setPhone(stored?.phone || "");
        setEmail(stored?.email || "");
        setNotificationEmail([
            stored?.notifications?.email?.deviceStatusUpdates ?? false,
            stored?.notifications?.email?.geofenceAlerts ?? false
        ]);
        setNotificationSMS([
            stored?.notifications?.sms?.deviceStatusUpdates ?? false,
            stored?.notifications?.sms?.geofenceAlerts ?? false
        ]);
        setPreviewUrl(stored?.profilePic || "/api/placeholder/80/80")
        setProfileImage(null);
    }, [reduxUser]);

    const handleSaveProfile = async () => {
        const initial = initialUserRef.current;
        const updates = {};

        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        if (fullName !== initial.fullName) updates.fullName = fullName;
        if (username !== initial.username) updates.username = username;
        if (phone !== initial.phone) updates.phone = phone;
        if (profileImage) updates.userProfilePic = profileImage;

        if (Object.keys(updates).length === 0) {
            setIsSubmitting(false)
            toast.info("No changes to save")
            return;
        }

        let body, headers = {};
        if (updates.userProfilePic) {
            body = new FormData();
            Object.entries(updates).forEach(([key, val]) => {
                body.append(key, val);
            });
        } else {
            body = JSON.stringify(updates);
            headers["Content-Type"] = "application/json";
        }
        headers["authorization"] = `Bearer ${localStorage.getItem("token")}`

        try {
            const res = await fetch(`${BACKEND_URL}/api/user/update-user`, {
                method: "PUT",
                headers,
                body,
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || res.statusText || 'Failed to update User');
            }
            const data = await res.json();
            setSubmitSuccess(true);
            toast.success("Profile Updated Successfully")

            initialUserRef.current = {
                ...initialUserRef.current,
                ...data.user,
            };

            console.log(data)
            dispatch(setUser(data.user))
            localStorage.setItem("user", JSON.stringify(data.user))
        } catch (err) {
            setSubmitError(err.message || 'An unexpected error occurred');
            console.error("Save failed", err);
            toast.error(`Error: ${submitError}`)
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword === currentPassword) {
            toast.error("Your new password must be different from the current one.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMatch(false);
            toast.error("New password and confirmation do not match.");
            return;
        }

        setError(null)
        setPasswordMatch(true);
        setIsSubmitting(true);

        try {
            const res = await fetch(`${BACKEND_URL}/api/user/updatepassword`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || res.statusText);
            }

            toast.success("Password updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMatch(true);
            setTimeout(() => setPasswordMatch(null), 3000);

        } catch (error) {
            console.error("Password update failed:", error);
            toast.error(`Error: ${error.message}`);
            setPasswordMatch(false);
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        console.log(file)
        processFile(file);
    };

    const processFile = (file) => {
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            setSubmitError("File size exceeds 50MB limit");
            return;
        }

        setProfileImage(file);
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSaveNotifications = async () => {
        const initial = initialNotifRef.current;
        const updates = {};

        const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

        if (!arraysEqual(notificationEmail, initial.email)) updates.notificationEmail = notificationEmail;
        if (!arraysEqual(notificationSMS, initial.sms)) updates.notificationSMS = notificationSMS;

        if (Object.keys(updates).length === 0) {
            toast.info("No changes to save.");
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/user/update-notifications`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(updates),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || res.statusText);
            }

            const { user } = await res.json();
            toast.success("Notification preferences updated!");

            initialNotifRef.current = {
                email: [
                    user.notifications?.email?.deviceStatusUpdates ?? false,
                    user.notifications?.email?.geofenceAlerts ?? false,
                ],
                sms: [
                    user.notifications?.sms?.deviceStatusUpdates ?? false,
                    user.notifications?.sms?.geofenceAlerts ?? false,
                ],
            };

            dispatch(setUser(user));
            localStorage.setItem("user", JSON.stringify(user));
        } catch (err) {
            console.error("Save failed", err);
            toast.error(`Error: ${err.message}`);
        }
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleLogOut = () => {
        localStorage.clear();
        dispatch(setAuth(false));
        dispatch(setAdmin(false));
        navigate("/login");
    }

    const MenuItems = () => {
        const dispatch = useDispatch();
        const mode = useSelector((state) => state.theme.mode); // 👈 Here’s the missing magic

        return (
            <>
                <div className="p-2">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 p-2 w-full text-left"
                    >
                        <ChevronLeft size={16} />
                        <span>Back to Dashboard</span>
                    </button>

                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings</p>

                    <NavButton icon={<User size={18} />} label="Profile" tab="profile" />
                    <NavButton icon={<Key size={18} />} label="Password" tab="password" />
                    <NavButton icon={<Bell size={18} />} label="Notifications" tab="notifications" />
                    <NavButton icon={<CreditCard size={18} />} label="Payments" tab="payments" />

                    <div className="border-t border-gray-800 mt-4 pt-4 space-y-2">
                        <button
                            onClick={() => dispatch(toggleTheme())}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-all"
                        >
                            {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            <span>{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>

                        <button
                            onClick={handleLogOut}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-gray-800 transition-all"
                        >
                            <LogOut size={18} />
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </>
        );
    };


    const NavButton = ({ icon, label, tab }) => (
        <button
            onClick={() => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${activeTab === tab
                ? "bg-indigo-900/50 text-white shadow-lg shadow-indigo-900/20"
                : "text-gray-400 hover:bg-gray-800/70 hover:text-gray-200"
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-[#111827] via-black to-[#10151b] text-gray-200">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-20">
                <h1 className="text-xl font-bold text-blue-500">TrackLink</h1>
                <button
                    onClick={toggleMobileMenu}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                    {mobileMenuOpen ? <XIcon size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/90 z-10 pt-20 px-4">
                    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-800 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center">
                                <User className="text-white" size={20} />
                            </div>
                            <div>
                                <p className="font-semibold">{fullName}</p>
                                <p className="text-xs text-gray-400">{email}</p>
                            </div>
                        </div>
                        <MenuItems />
                    </div>
                </div>
            )}

            {/* Left Sidebar - Desktop */}
            <div className="hidden md:flex w-72 lg:w-80 border-r border-gray-800 bg-gray-900/30 backdrop-blur-sm flex-col h-screen sticky top-0">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-blue-500">TrackLink</h1>
                </div>

                <div className="p-4 flex items-center space-x-3 border-b border-gray-800">
                    <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center">
                        <User className="text-white" size={20} />
                    </div>
                    <div>
                        <p className="font-semibold">{fullName}</p>
                        <p className="text-xs text-gray-400">{email}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <MenuItems />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto pb-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    {activeTab === "profile" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Profile Settings</h2>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSubmitting}
                                    className="hidden sm:flex px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors items-center gap-2 font-medium shadow-lg shadow-indigo-900/20"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center justify-center">
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                            Saving...
                                        </span>
                                    ) :
                                        <span className="flex items-center gap-2">
                                            <Save size={16} /> Save Changes
                                        </span>
                                    }
                                </button>
                            </div>

                            <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Profile Image Section */}
                                        <div className="flex flex-col items-center lg:items-start">
                                            <div className="group relative">
                                                {/* Profile Image */}
                                                <img
                                                    src={previewUrl}
                                                    alt="Profile"
                                                    className="w-32 h-32 rounded-full object-cover border-2 border-indigo-600 p-1 shadow-lg shadow-indigo-900/20"
                                                />

                                                {/* Upload Button (with hidden file input) */}
                                                <label
                                                    htmlFor="profile-upload"
                                                    className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg"
                                                >
                                                    <Upload size={16} className="text-white" />
                                                </label>
                                                <input
                                                    id="profile-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                />
                                            </div>

                                            <p className="text-sm text-gray-400 mt-4 mb-6">Upload a new profile picture</p>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Name field with icon */}
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <User size={18} className="text-gray-500" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={fullName}
                                                            onChange={(e) => setFullName(e.target.value)}
                                                            className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white shadow-inner"
                                                        />
                                                    </div>
                                                </div>

                                                {/* User ID field with icon */}
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Key size={18} className="text-gray-500" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={username}
                                                            onChange={(e) => setUsername(e.target.value)}
                                                            className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white shadow-inner"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Phone field with icon */}
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Phone size={18} className="text-gray-500" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={phone}
                                                            placeholder="+91 1234567890"
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            className="w-full pl-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white shadow-inner"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Email field with icon */}
                                                <div className="relative">
                                                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                                    <div className="relative">
                                                        {/* Mail Icon (left) */}
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Mail size={18} className="text-gray-500" />
                                                        </div>

                                                        {/* Pencil Icon (right) */}
                                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                            <button onClick={() => console.log("edit email clicked")} type="button" className="text-gray-500 hover:text-gray-300 cursor-not-allowed" title="Email can't be edited">
                                                                <Pencil size={16} />
                                                            </button>
                                                        </div>

                                                        <input
                                                            type="email"
                                                            value={email}
                                                            readOnly
                                                            disabled
                                                            className="w-full pl-10 pr-10 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none text-gray-400 cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-xl">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <CreditCard className="mr-2 text-indigo-400" size={20} />
                                    Payment Method
                                </h3>
                                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 mb-6">
                                        <div className="h-12 w-16 bg-gray-700 rounded-md flex items-center justify-center mb-4 sm:mb-0">
                                            <span className="text-lg font-bold">VISA</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">•••• •••• •••• 4242</p>
                                            <p className="text-sm text-gray-400">Expires 12/27</p>
                                        </div>
                                        <div className="ml-auto mt-4 sm:mt-0">
                                            <span className="px-3 py-1 text-xs rounded-full bg-indigo-900/70 text-indigo-300 border border-indigo-700">
                                                Default
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2">
                                            <CreditCard size={16} />
                                            Update Payment Method
                                        </button>
                                        <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                            <Save size={16} />
                                            Billing Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {
                        activeTab === "password" && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">Update Password</h2>
                                <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl shadow-xl max-w-2xl">
                                    <div className="p-6 space-y-4">
                                        <FieldWithToggle
                                            label="Current Password"
                                            placeholder="Your current password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            show={showCurrent}
                                            setShow={setShowCurrent}
                                        />

                                        <FieldWithToggle
                                            label="New Password"
                                            placeholder="Set a new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            show={showNew}
                                            setShow={setShowNew}
                                        />

                                        {/* Confirm New Password */}
                                        <FieldWithToggle
                                            label="Confirm New Password"
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            show={showConfirm}
                                            setShow={setShowConfirm}
                                            error={passwordMatch === false}
                                            errorMessage="Passwords do not match"
                                        />

                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center justify-center">
                                                    <Loader2 size={16} className="animate-spin mr-2" />
                                                    Updating Password...
                                                </span>
                                            ) :
                                                <span className="flex items-center gap-2">
                                                    <Key size={18} /> Update Password
                                                </span>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === "notifications" && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Notification Settings</h2>
                                    <button
                                        onClick={handleSaveNotifications}
                                        className="hidden sm:flex px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors items-center gap-2 font-medium shadow-lg shadow-indigo-900/20"
                                    >
                                        <Save size={16} />
                                        Save Preferences
                                    </button>
                                </div>

                                <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <Mail className="mr-2 text-indigo-400" size={20} />
                                                Email Notifications
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                                    <div className="mb-3 sm:mb-0">
                                                        <p className="font-medium">Device Status Updates</p>
                                                        <p className="text-sm text-gray-400">Receive updates when your device status changes</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationEmail[0]}
                                                            onChange={() => setNotificationEmail(prev => [!prev[0], prev[1]])}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                                    <div className="mb-3 sm:mb-0">
                                                        <p className="font-medium">Geofence Alerts</p>
                                                        <p className="text-sm text-gray-400">Receive alerts when your device enters or exits defined areas</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationEmail[1]}
                                                            onChange={() => setNotificationEmail(prev => [prev[0], !prev[1]])}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-800 pt-6">
                                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                                <Phone className="mr-2 text-indigo-400" size={20} />
                                                SMS Notifications
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                                    <div className="mb-3 sm:mb-0">
                                                        <p className="font-medium">Device Status Updates</p>
                                                        <p className="text-sm text-gray-400">Receive SMS alerts when your device status changes</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationSMS[0]}
                                                            onChange={() => setNotificationSMS((prev => [!prev[0], prev[1]]))}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                                    <div className="mb-3 sm:mb-0">
                                                        <p className="font-medium">Geofence Alerts</p>
                                                        <p className="text-sm text-gray-400">Receive SMS alerts when your device enters or exits defined areas</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={notificationSMS[1]}
                                                            onChange={() => setNotificationSMS((prev => [prev[0], !prev[1]]))}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-12 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer with Save Button - Mobile only */}
                                    <div className="bg-gray-900/80 border-t border-gray-800 p-4 sm:hidden">
                                        <button
                                            onClick={handleSaveNotifications}
                                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-900/20"
                                        >
                                            <Save size={18} />
                                            Save Preferences
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        activeTab === "payments" && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold">Payment History</h2>
                                <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                                    <div className="p-6">
                                        <div className="overflow-x-auto">
                                            <table className="w-full divide-y divide-gray-800">
                                                <thead>
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-800">
                                                    <tr className="bg-gray-800/20 hover:bg-gray-800/40 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">April 13, 2025</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">Premium Subscription</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">$29.99</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span className="px-3 py-1 text-xs rounded-full bg-green-900/70 text-green-300 border border-green-700">Paid</span>
                                                        </td>
                                                    </tr>
                                                    <tr className="hover:bg-gray-800/40 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">March 13, 2025</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">Premium Subscription</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">$29.99</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span className="px-3 py-1 text-xs rounded-full bg-green-900/70 text-green-300 border border-green-700">Paid</span>
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-gray-800/20 hover:bg-gray-800/40 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">February 13, 2025</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">Premium Subscription</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">$29.99</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <span className="px-3 py-1 text-xs rounded-full bg-green-900/70 text-green-300 border border-green-700">Paid</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl p-6 shadow-xl">
                                    {/* <div className="bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 rounded-lg p-6"> */}
                                    <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                                    <div className="flex items-center space-x-4 p-4 border border-gray-700 rounded-md bg-gray-900">
                                        <div className="h-10 w-14 bg-gray-800 rounded flex items-center justify-center">
                                            <span className="text-sm font-bold">VISA</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">•••• •••• •••• 4242</p>
                                            <p className="text-sm text-gray-400">Expires 12/27</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex space-x-4">
                                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                            Update Payment Method
                                        </button>
                                        <button className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600">
                                            Billing Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
}
