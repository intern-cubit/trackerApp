import { toast } from 'react-toastify';
import {
    Loader2,
    Key,
} from "lucide-react";
import { setError } from '../../features/trackerSlice'; // Assuming setError is relevant for some global error state
import { useState } from 'react';
import FieldWithToggle from './FieldWithToggle'; // Re-using your existing FieldWithToggle
import { useSelector } from 'react-redux'; // Import useSelector

const ChangePassword = () => {
    const [passwordMatch, setPasswordMatch] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    // Get dark mode status from Redux store
    const isDarkMode = useSelector((state) => state.theme.mode === 'dark');

    // Define internal styles for elements where Tailwind's dark: is not sufficient or for conditional styles
    const styles = {
        // Styles for the main content box
        contentBox: {
            backgroundColor: isDarkMode ? 'rgba(30,30,30,0.5)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            border: isDarkMode ? '1px solid #1f2937' : '1px solid #e5e7eb', // gray-800 vs gray-200
            boxShadow: isDarkMode ? '0 10px 15px rgba(0, 0, 0, 0.2)' : '0 10px 15px rgba(0, 0, 0, 0.1)',
        },
        // Styles for the update button's shadow, as Tailwind's dark: might not handle custom colors easily here
        updateButtonShadow: isDarkMode ? '0 10px 15px rgba(67, 56, 202, 0.2)' : '0 10px 15px rgba(106, 90, 205, 0.2)',
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

        setError(null) // Assuming setError is from Redux and handles global errors
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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Update Password</h2>
            <div
                className="rounded-xl max-w-2xl"
                style={styles.contentBox}
            >
                <div className="p-6 space-y-4">
                    <FieldWithToggle
                        label="Current Password"
                        placeholder="Your current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        show={showCurrent}
                        setShow={setShowCurrent}
                        // Pass isDarkMode to FieldWithToggle if it also needs to adapt its internal styles
                        isDarkMode={isDarkMode}
                    />

                    <FieldWithToggle
                        label="New Password"
                        placeholder="Set a new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        show={showNew}
                        setShow={setShowNew}
                        isDarkMode={isDarkMode}
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
                        isDarkMode={isDarkMode}
                    />

                    <button
                        onClick={handleChangePassword}
                        disabled={isSubmitting}
                        className={`w-full sm:w-auto px-6 py-3 rounded-lg flex items-center justify-center gap-2
                            transition-colors
                            ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                        `}
                        style={{ boxShadow: styles.updateButtonShadow }}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center text-white">
                                <Loader2 size={16} className="animate-spin mr-2" />
                                Updating Password...
                            </span>
                        ) :
                            <span className="flex items-center gap-2 text-white">
                                <Key size={18} /> Update Password
                            </span>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChangePassword;