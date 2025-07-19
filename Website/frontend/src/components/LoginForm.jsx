import { useState } from "react";
import { useDispatch } from "react-redux";
import { loginStart, loginSuccess, loginFailure } from "../features/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
    const [form, setForm] = useState({ identifier: "", password: "" });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing again
        if (error) setError("");
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        dispatch(loginStart());

        try {
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed. Please check your credentials.");
            }

            dispatch(loginSuccess({ token: data.token, user: data.user }));
            navigate("/dashboard");
        } catch (err) {
            dispatch(loginFailure());
            setError(err.message || "Login failed. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md p-8 rounded-xl bg-[rgba(30,30,30,0.5)] backdrop-blur-md border border-gray-800 transition-all duration-300 hover:shadow-[0_0_15px_rgba(106,90,205,0.3)] overflow-hidden"
        >
            <h2 className="text-3xl font-bold text-center text-purple-300 tracking-wider mb-6 drop-shadow">
                LOGIN TO TRACKER-WEB
            </h2>

            {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm text-center mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-5">
                <div>
                    <label className="block mb-1.5 text-sm font-medium text-purple-200">
                        Email or Username
                    </label>
                    <input
                        name="identifier"
                        value={form.identifier}
                        onChange={handleChange}
                        placeholder="Enter your email or username"
                        required
                        autoComplete="username"
                        autoFocus
                        className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900/50 text-purple-100 rounded-lg placeholder-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    />
                </div>

                <div>
                    <label className="block mb-1.5 text-sm font-medium text-purple-200">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900/50 text-purple-100 rounded-lg placeholder-purple-400/70 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition pr-10"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-purple-300 hover:text-purple-100 transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                    <div className="text-right mt-2">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-purple-300 hover:underline hover:text-purple-100 transition"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`mt-6 w-full font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-300 
                  ${isLoading
                        ? "bg-purple-500/60 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 active:bg-purple-800"} text-white`}
            >
                {isLoading ? "Logging in..." : "Login"}
            </button>

            <p className="text-center text-sm text-purple-300 mt-6">
                Don't have an account?{" "}
                <Link
                    to="/register"
                    className="text-purple-200 font-medium hover:text-white hover:underline transition"
                >
                    Sign up
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
    );
}