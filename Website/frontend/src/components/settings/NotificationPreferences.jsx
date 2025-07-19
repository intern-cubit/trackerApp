import { toast } from 'react-toastify';
import {
    Mail,
    Phone,
    Save,
} from "lucide-react";
import { setUser } from "../../features/authSlice";
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useRef, useState } from 'react';

const NotificationPreferences = () => {
    const reduxUser = useSelector(state => state.auth.user);
    // Get the current theme mode from Redux
    const isDarkMode = useSelector(state => state.theme.mode === 'dark');

    const [notificationEmail, setNotificationEmail] = useState([false, false]);
    const [notificationSMS, setNotificationSMS] = useState([false, false]);
    const initialNotifRef = useRef({ email: notificationEmail, sms: notificationSMS });

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const dispatch = useDispatch();

    useEffect(() => {
        const stored = reduxUser || JSON.parse(localStorage.getItem("user") || "{}");
        setNotificationEmail([
            stored?.notifications?.email?.deviceStatusUpdates ?? false,
            stored?.notifications?.email?.geofenceAlerts ?? false
        ]);
        setNotificationSMS([
            stored?.notifications?.sms?.deviceStatusUpdates ?? false,
            stored?.notifications?.sms?.geofenceAlerts ?? false
        ]);
        // Update the ref with initial values after setting state
        initialNotifRef.current = {
            email: [
                stored?.notifications?.email?.deviceStatusUpdates ?? false,
                stored?.notifications?.email?.geofenceAlerts ?? false
            ],
            sms: [
                stored?.notifications?.sms?.deviceStatusUpdates ?? false,
                stored?.notifications?.sms?.geofenceAlerts ?? false
            ],
        };
    }, [reduxUser]); // Depend on reduxUser to re-initialize if user data changes

    const handleSaveNotifications = async () => {
        const initial = initialNotifRef.current;
        const updates = {};

        const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

        // Check if current state is different from initial state before sending
        if (!arraysEqual(notificationEmail, initial.email)) {
            updates.notificationEmail = notificationEmail;
        }
        if (!arraysEqual(notificationSMS, initial.sms)) {
            updates.notificationSMS = notificationSMS;
        }

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

            // Update initialNotifRef with the new saved preferences from the server response
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Notification Settings</h2>
                <button
                    onClick={handleSaveNotifications}
                    className="hidden sm:flex px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors items-center gap-2 font-medium shadow-lg shadow-indigo-900/20
                               dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:shadow-indigo-700/20"
                >
                    <Save size={16} />
                    Save Preferences
                </button>
            </div>

            <div className="bg-white/60 backdrop-blur-md border border-gray-200 rounded-xl overflow-hidden shadow-xl
                          dark:bg-gray-900/60 dark:border-gray-800">
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
                            <Mail className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
                            Email Notifications
                        </h3>
                        <div className="space-y-4">
                            {/* Device Status Updates - Email */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border
                                        bg-gray-50/50 border-gray-200/50
                                        dark:bg-gray-800/50 dark:border-gray-700/50">
                                <div className="mb-3 sm:mb-0">
                                    <p className="font-medium text-gray-900 dark:text-white">Device Status Updates</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates when your device status changes</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notificationEmail[0]}
                                        onChange={() => setNotificationEmail(prev => [!prev[0], prev[1]])}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer
                                                peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                                peer-checked:bg-indigo-600 dark:bg-gray-700 dark:peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>

                            {/* Geofence Alerts - Email */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border
                                        bg-gray-50/50 border-gray-200/50
                                        dark:bg-gray-800/50 dark:border-gray-700/50">
                                <div className="mb-3 sm:mb-0">
                                    <p className="font-medium text-gray-900 dark:text-white">Geofence Alerts</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive alerts when your device enters or exits defined areas</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notificationEmail[1]}
                                        onChange={() => setNotificationEmail(prev => [prev[0], !prev[1]])}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer
                                                peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                                peer-checked:bg-indigo-600 dark:bg-gray-700 dark:peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
                        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
                            <Phone className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
                            SMS Notifications
                        </h3>
                        <div className="space-y-4">
                            {/* Device Status Updates - SMS */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border
                                        bg-gray-50/50 border-gray-200/50
                                        dark:bg-gray-800/50 dark:border-gray-700/50">
                                <div className="mb-3 sm:mb-0">
                                    <p className="font-medium text-gray-900 dark:text-white">Device Status Updates</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive SMS alerts when your device status changes</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notificationSMS[0]}
                                        onChange={() => setNotificationSMS((prev => [!prev[0], prev[1]]))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer
                                                peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                                peer-checked:bg-indigo-600 dark:bg-gray-700 dark:peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>

                            {/* Geofence Alerts - SMS */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border
                                        bg-gray-50/50 border-gray-200/50
                                        dark:bg-gray-800/50 dark:border-gray-700/50">
                                <div className="mb-3 sm:mb-0">
                                    <p className="font-medium text-gray-900 dark:text-white">Geofence Alerts</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive SMS alerts when your device enters or exits defined areas</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={notificationSMS[1]}
                                        onChange={() => setNotificationSMS((prev => [prev[0], !prev[1]]))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer
                                                peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                                peer-checked:bg-indigo-600 dark:bg-gray-700 dark:peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with Save Button - Mobile only */}
                <div className="border-t p-4 sm:hidden
                                bg-gray-100/80 border-gray-200
                                dark:bg-gray-900/80 dark:border-gray-800">
                    <button
                        onClick={handleSaveNotifications}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-900/20
                                   dark:bg-indigo-700 dark:hover:bg-indigo-800 dark:shadow-indigo-700/20"
                    >
                        <Save size={18} />
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotificationPreferences;