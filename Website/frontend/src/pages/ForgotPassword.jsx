import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSent) return;

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Something went wrong.");

            setMessage(data.message || "Reset email sent!");
            setError("");
            setIsSent(true);
        } catch (err) {
            setError(err.message);
            setMessage("");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        // Clear error when user starts typing again
        if (error) setError("");
    };

    return (
        <div  className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#111827] via-black to-[#10151b] px-4">
            <div className="w-full max-w-md">
                <form
                    onSubmit={handleSubmit}
                    className="p-8 rounded-xl bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)] overflow-hidden"
                >
                    <h2 className="text-3xl font-bold text-center text-purple-300 tracking-wider mb-2 drop-shadow">
                        FORGOT PASSWORD
                    </h2>
                    <p className="text-center text-sm text-purple-200/70 mb-6">
                        Enter your email to receive reset instructions
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
                        <div>
                            <label className="block mb-1.5 text-sm font-medium text-purple-200">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={handleChange}
                                placeholder="Enter your email address"
                                required
                                autoComplete="email"
                                autoFocus
                                className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900/50 text-purple-100 rounded-lg placeholder-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || isSent}
                        className={`mt-6 w-full font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 
                          ${isSent
                                ? "bg-green-600/60 cursor-not-allowed"
                                : loading
                                    ? "bg-purple-500/60 cursor-not-allowed"
                                    : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"} text-white`}
                    >
                        {isSent ? "Email Sent" : loading ? "Sending..." : "Send Reset Instructions"}
                    </button>

                    {isSent && (
                        <div className="text-center mt-4 text-sm text-purple-200/70">
                            Didn't receive an email? Check your spam folder or try again in a few minutes.
                        </div>
                    )}

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

export default ForgotPassword;