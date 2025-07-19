import { toast } from 'react-toastify';
import {
    User,
    CreditCard,
    Key,
    Upload,
    Mail,
    Phone,
    Save,
    Pencil,
    Loader2,
} from "lucide-react";
import { setUser } from "../../features/authSlice";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';

const SettingsProfilePage = () => {
    const reduxUser = useSelector((state) => state.auth.user);
    // Get the current theme mode from Redux
    const isDarkMode = useSelector(state => state.theme.mode === 'dark');

    const initialUserRef = useRef(null);
    const [profileImage, setProfileImage] = useState(null); // Changed to null as initial state
    const [previewUrl, setPreviewUrl] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const [fullName, setFullName] = useState("");
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const dispatch = useDispatch();

    useEffect(() => {
        const stored = reduxUser || JSON.parse(localStorage.getItem("user") || "{}");
        initialUserRef.current = { ...stored };
        setFullName(stored?.fullName || "");
        setUsername(stored?.username || "");
        setPhone(stored?.phone || "");
        setEmail(stored?.email || "");
        // Use a default placeholder if profilePic is not available
        setPreviewUrl(stored?.profilePic || "/placeholder-profile.jpg"); // Assuming you have a placeholder image
        setProfileImage(null); // Reset profileImage for new session
    }, [reduxUser]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            setSubmitError("File size exceeds 50MB limit");
            toast.error("File size exceeds 50MB limit");
            return;
        }

        setProfileImage(file);
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
        setSubmitError(null); // Clear any previous file size errors
    };


    const handleSaveProfile = async () => {
        const initial = initialUserRef.current;
        const updates = {};

        setIsSubmitting(true);
        setSubmitError(null); // Clear previous errors

        if (fullName !== initial.fullName) updates.fullName = fullName;
        if (username !== initial.username) updates.username = username;
        if (phone !== initial.phone) updates.phone = phone;
        if (profileImage) updates.userProfilePic = profileImage; // Changed key to match backend expectation if any

        if (Object.keys(updates).length === 0) {
            setIsSubmitting(false);
            toast.info("No changes to save");
            return;
        }

        let body;
        const headers = {
            "authorization": `Bearer ${localStorage.getItem("token")}`
        };

        if (updates.userProfilePic) {
            body = new FormData();
            Object.entries(updates).forEach(([key, val]) => {
                body.append(key, val);
            });
        } else {
            body = JSON.stringify(updates);
            headers["Content-Type"] = "application/json";
        }

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
            toast.success("Profile Updated Successfully");

            // Update initialUserRef with the new data from the server
            initialUserRef.current = {
                ...initialUserRef.current,
                ...data.user,
            };

            dispatch(setUser(data.user));
            localStorage.setItem("user", JSON.stringify(data.user));
        } catch (err) {
            setSubmitError(err.message || 'An unexpected error occurred');
            console.error("Save failed", err);
            toast.error(`Error: ${err.message || 'An unexpected error occurred'}`); // Display actual error message
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Profile Settings</h2>
                <button
                    onClick={handleSaveProfile}
                    disabled={isSubmitting}
                    className={`hidden sm:flex px-4 py-2 rounded-md transition-colors items-center gap-2 font-medium shadow-lg text-white
                               ${isSubmitting
                                   ? 'bg-indigo-400 dark:bg-indigo-500 cursor-not-allowed'
                                   : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 shadow-indigo-900/20 dark:shadow-indigo-700/20'
                               }`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center">
                            <Loader2 size={16} className="animate-spin mr-2" />
                            Saving...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Save size={16} /> Save Changes
                        </span>
                    )}
                </button>
            </div>

            {/* Main Content Box */}
            <div className="bg-white/60 backdrop-blur-md border border-gray-200 rounded-xl overflow-hidden shadow-xl
                          dark:bg-gray-900/60 dark:border-gray-800">
                <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Profile Image Section */}
                        <div className="flex flex-col items-center lg:items-start">
                            <div className="group relative">
                                {/* Profile Image */}
                                <img
                                    src={previewUrl}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover p-1 shadow-lg
                                               border-2 border-indigo-600 dark:border-indigo-500
                                               shadow-indigo-900/20 dark:shadow-indigo-700/20"
                                />

                                {/* Upload Button (with hidden file input) */}
                                <label
                                    htmlFor="profile-upload"
                                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-lg
                                               bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800"
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

                            <p className="text-sm mt-4 mb-6 text-gray-600 dark:text-gray-400">
                                Upload a new profile picture (Max 50MB)
                            </p>
                            {submitError && (
                                <p className="text-red-500 text-sm mt-2">{submitError}</p>
                            )}
                        </div>

                        {/* Form Fields */}
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Full Name field with icon */}
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-400">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User size={18} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-10 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner
                                                       bg-gray-100 border border-gray-300 text-gray-900
                                                       dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Username field with icon */}
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-400">Username</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key size={18} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-10 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner
                                                       bg-gray-100 border border-gray-300 text-gray-900
                                                       dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Phone field with icon */}
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-400">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Phone size={18} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={phone}
                                            placeholder="+91 1234567890"
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-10 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner
                                                       bg-gray-100 border border-gray-300 text-gray-900
                                                       dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>

                                {/* Email field with icon */}
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-400">Email Address</label>
                                    <div className="relative">
                                        {/* Mail Icon (left) */}
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-gray-500 dark:text-gray-400" />
                                        </div>

                                        {/* Pencil Icon (right) */}
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <button
                                                onClick={() => toast.info("Email cannot be edited")}
                                                type="button"
                                                className="text-gray-500 hover:text-gray-300 cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-300"
                                                title="Email can't be edited"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </div>

                                        <input
                                            type="email"
                                            value={email}
                                            readOnly
                                            disabled
                                            className="w-full pl-10 pr-10 px-4 py-3 rounded-lg focus:outline-none cursor-not-allowed shadow-inner
                                                       bg-gray-200 border border-gray-300 text-gray-600
                                                       dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method Section */}
            <div className="bg-white/60 backdrop-blur-md border border-gray-200 rounded-xl p-6 shadow-xl
                          dark:bg-gray-900/60 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
                    <CreditCard className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
                    Payment Method
                </h3>
                <div className="p-6 rounded-xl border
                            bg-gray-50/50 border-gray-200/50
                            dark:bg-gray-800/50 dark:border-gray-700/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 mb-6">
                        <div className="h-12 w-16 rounded-md flex items-center justify-center mb-4 sm:mb-0
                                       bg-gray-200 dark:bg-gray-700">
                            <span className="text-lg font-bold text-gray-700 dark:text-white">VISA</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Expires 12/27</p>
                        </div>
                        <div className="ml-auto mt-4 sm:mt-0">
                            <span className="px-3 py-1 text-xs rounded-full border
                                           bg-indigo-100 text-indigo-700 border-indigo-300
                                           dark:bg-indigo-900/70 dark:text-indigo-300 dark:border-indigo-700">
                                Default
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="px-4 py-2 rounded-lg transition-colors shadow-lg
                                       bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-900/20
                                       dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:shadow-indigo-700/20 flex items-center justify-center gap-2">
                            <CreditCard size={16} />
                            Update Payment Method
                        </button>
                        <button className="px-4 py-2 rounded-lg transition-colors
                                       bg-gray-200 text-gray-800 hover:bg-gray-300
                                       dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 flex items-center justify-center gap-2">
                            <Save size={16} />
                            Billing Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer with Save Button - Mobile only */}
            <div className="bg-gray-100/80 border-t border-gray-200 p-4 sm:hidden
                            dark:bg-gray-900/80 dark:border-gray-800">
                <button
                    onClick={handleSaveProfile}
                    disabled={isSubmitting}
                    className={`w-full px-6 py-3 rounded-md transition-colors flex items-center justify-center gap-2 font-medium shadow-lg
                               ${isSubmitting
                                   ? 'bg-indigo-400 dark:bg-indigo-500 cursor-not-allowed'
                                   : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 shadow-indigo-900/20 dark:shadow-indigo-700/20'
                               }`}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={18} className="animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SettingsProfilePage;