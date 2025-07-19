import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const RegistrationForm = () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const [form, setForm] = useState({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        // Clear error when user starts typing again
        if (error) setError("");
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Registration failed.");
            }

            // Success notification
            navigate("/login", { state: { message: "Registration successful! Please log in." } });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto px-4 sm:px-0 py-4">
            <div className="bg-[rgba(30,30,30,0.5)] backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)]">
                <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-purple-500/30">
                    <h2 className="text-xl sm:text-2xl font-bold text-purple-300">Create Account</h2>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-purple-200/70">Join our community and start your journey</p>
                </div>

                <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                    {error && (
                        <div className="bg-red-900/20 border-l-4 border-red-500 p-2 sm:p-4 rounded text-xs sm:text-sm">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-2 sm:ml-3">
                                    <p className="text-xs sm:text-sm text-red-400">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Name and Username - Stack on mobile, side by side on larger screens */}
                    <div className="grid gap-3 sm:gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-1">Full Name</label>
                            <input
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                className="w-full px-3 py-1.5 sm:py-2 border border-gray-700 bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-purple-100 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-1">Username</label>
                            <input
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="johndoe"
                                required
                                className="w-full px-3 py-1.5 sm:py-2 border border-gray-700 bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-purple-100 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            required
                            className="w-full px-3 py-1.5 sm:py-2 border border-gray-700 bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-purple-100 text-sm"
                        />
                    </div>

                    {/* Password fields - Stack on mobile, side by side on larger screens */}
                    <div className="grid gap-3 sm:gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3 py-1.5 sm:py-2 border border-gray-700 bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-purple-100 pr-10 text-sm"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-purple-100"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                    ) : (
                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-purple-200 mb-1">Confirm</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3 py-1.5 sm:py-2 border border-gray-700 bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-purple-100 pr-10 text-sm"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-300 hover:text-purple-100"
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                    ) : (
                                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 sm:pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${loading ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {loading ? "Processing..." : "Create Account"}
                        </button>
                    </div>
                </form>

                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-center text-xs sm:text-sm text-purple-200/70">
                        Already have an account?{" "}
                        <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300">
                            Sign in
                        </Link>
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center text-xs text-purple-400 hover:underline hover:text-purple-200 transition"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default RegistrationForm