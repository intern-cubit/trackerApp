import { useState } from "react";
import { useSelector } from "react-redux"; // Import useSelector
import SettingsProfilePage from "../components/settings/SettingsProfilePage";
import ChangePassword from "../components/settings/ChangePassword";
import NotificationPreferences from "../components/settings/NotificationPreferences";
import Paymentsettings from "../components/settings/Paymentsettings";
import SettingsSidebar from "../components/settings/SettingsSidebar";

export default function Settings() {
    const [activeTab, setActiveTab] = useState("profile");
    // Get the current theme mode from Redux
    const isDarkMode = useSelector(state => state.theme.mode === 'dark');

    return (
        <div className={`flex flex-col md:flex-row min-h-screen ${isDarkMode ? "bg-gradient-to-br from-[#111827] via-black to-[#10151b] text-gray-200" : "bg-gray-100 text-gray-800"}`}>
            <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="flex-1 overflow-y-auto pb-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    {
                        activeTab === "profile" && <SettingsProfilePage />
                    }
                    {
                        activeTab === "password" && <ChangePassword />
                    }
                    {
                        activeTab === "notifications" && <NotificationPreferences />
                    }
                    {
                        activeTab === "payments" && <Paymentsettings />
                    }
                </div>
            </div>
        </div>
    );
}