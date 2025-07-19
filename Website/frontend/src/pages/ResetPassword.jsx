import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const handleChange = (field, value) => {
        if (field === 'newPassword') {
            setNewPassword(value);
        } else {
            setConfirmPassword(value);
        }
        // Clear error when user starts typing again
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong.");
            }

            setMessage(data.message || "Password reset successfully!");
            setError("");

            // Redirect to login after a brief delay
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            setError(err.message || "Error occurred");
            setMessage("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#111827] via-black to-[#10151b] px-4"
        >
            <div className="w-full max-w-md">
                <form
                    onSubmit={handleSubmit}
                    className="p-8 rounded-xl bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)] overflow-hidden"
                >
                    <h2 className="text-3xl font-bold text-center text-purple-300 tracking-wider mb-2 drop-shadow">
                        RESET PASSWORD
                    </h2>
                    <p className="text-center text-sm text-purple-200/70 mb-6">
                        Enter your new password below
                    </p>

                    {message && (
                        <div className="bg-green-900/30 border border-green-700 text-green-300 px-4 py-2 rounded-lg text-sm text-center mb-4">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm text-center mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* New Password Field */}
                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-purple-200">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={newPasswordVisible ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => handleChange('newPassword', e.target.value)}
                                    placeholder="Enter your new password"
                                    required
                                    autoComplete="new-password"
                                    autoFocus
                                    className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900/50 text-purple-100 rounded-lg placeholder-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-purple-300 hover:text-purple-100 transition-colors"
                                    aria-label={newPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {newPasswordVisible ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-purple-200">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={confirmPasswordVisible ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                    placeholder="Confirm your new password"
                                    required
                                    autoComplete="new-password"
                                    className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900/50 text-purple-100 rounded-lg placeholder-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-purple-300 hover:text-purple-100 transition-colors"
                                    aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                                >
                                    {confirmPasswordVisible ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`mt-6 w-full font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 
                          ${loading
                                ? "bg-purple-500/60 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"} text-white`}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>

                    <p className="text-center text-sm text-purple-300 mt-6">
                        Remembered your password?{" "}
                        <Link
                            to="/login"
                            className="text-purple-200 font-medium hover:text-white hover:underline transition"
                        >
                            Back to Login
                        </Link>
                    </p>

                    <div className="text-center mt-4">
                        <Link
                            to="/"
                            className="inline-flex items-center text-xs text-purple-400 hover:underline hover:text-purple-200 transition"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;