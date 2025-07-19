import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import RegistrationPage from "./pages/RegistrationPage";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import { useEffect } from "react";
import { setAdmin, setAuth, setAuthChecked } from "./features/authSlice";
import { useDispatch, useSelector } from "react-redux";
import SettingsPage from "./pages/SettingsPage";
import ThemeHandler from "./utils/themeHandler";
import Settings from "./pages/Settings";

function App() {
    const isAuth = useSelector(state => state.auth.isAuthenticated)
    const isAdmin = useSelector(state => state.auth.isAdmin);
    const isAuthChecked = useSelector(state => state.auth.isAuthChecked);
    const dispatch = useDispatch();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log("Checking authentication status...");
                const response = await fetch(`${BACKEND_URL}/api/auth/check-auth`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
                );

                if (!response.ok) {
                    dispatch(setAuth(false));
                    dispatch(setAdmin(false));
                    localStorage.clear();
                    return;
                }

                const data = await response.json();
                console.log("Auth check response:", data);
                dispatch(setAuth(true))
                dispatch(setAdmin(data.isAdmin));
            } catch (err) {
                console.error("Auth check failed:", err);
                dispatch(setAuth(false));
                dispatch(setAdmin(false));
                localStorage.clear();
            } finally {
                dispatch(setAuthChecked(true));
            }
        };

        checkAuth();
    }, []);

    if (!isAuthChecked) return <div className="text-center p-10">🔄 Checking authentication...</div>;
    return (
        <>
            <ThemeHandler />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={isAuth ? <Navigate to={"/dashboard"} /> : <LandingPage />} />
                    <Route
                        path="/login"
                        element={!isAuth ? <LoginPage /> : isAdmin ? <Navigate to={"/admin/dashboard"} /> : <Navigate to={"/dashboard"} />}
                    />
                    <Route
                        path="/register"
                        element={!isAuth ? <RegistrationPage /> : isAdmin ? <Navigate to={"/admin/dashboard"} /> : <Navigate to={"/dashboard"} />}
                    />
                    <Route
                        path="/reset-password/:token"
                        element={!isAuth ? <ResetPassword /> : isAdmin ? <Navigate to={"/admin/dashboard"} /> : <Navigate to={"/dashboard"} />}
                    />
                    <Route
                        path="forgot-password"
                        element={!isAuth ? <ForgotPassword /> : isAdmin ? <Navigate to={"/admin/dashboard"} /> : <Navigate to={"/dashboard"} />}
                    />
                    <Route
                        path="/dashboard"
                        element={!isAuth ? <Navigate to={"/login"} /> : <Dashboard />}
                    />
                    <Route
                        path="/admin/dashboard"
                        element={!isAuth ? <Navigate to={"/login"} /> : isAdmin ? <AdminDashboard /> : <Navigate to={"/dashboard"} />}
                    />
                    <Route
                        path="/settings"
                        element={!isAuth ? <Navigate to={"/login"} /> : <Settings/>}
                    />
                </Routes>
            </BrowserRouter>
            <ToastContainer
                toastStyle={{
                    backgroundColor: 'rgba(30, 30, 30, 0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid #1f2937',
                    color: '#a0a0a0'
                }}
                position="top-right"
                autoClose={2000}
                newestOnTop
                closeOnClick
                pauseOnHover
            />
        </>
    );
}

export default App;
