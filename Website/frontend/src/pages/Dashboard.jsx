import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    setLoading, setError, setTrackers, selectTracker
} from "../features/trackerSlice";
import MobileHeader from "../components/dashboard/MobileHeader";
import Sidebar from "../components/dashboard/Sidebar";
import MainContent from "../components/dashboard/MainContent";
import { useLiveTracker } from "../hooks/useLiveTracker";

export default function Dashboard() {
    const { path, latest, deviceDetails } = useLiveTracker();
    const dispatch = useDispatch();
    const token = useSelector((state) => state.auth.token);
    const trackers = useSelector((state) => state.tracker.trackers);
    const selectedTrackerId = useSelector((state) => state.tracker.selectedTrackerId);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    const [tab, setTab] = useState("live");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [statsExpanded, setStatsExpanded] = useState(true);

    const selectedDevice = useMemo(() => {
        return trackers.find(t => t.tracker._id === selectedTrackerId) || null;
    }, [trackers, selectedTrackerId]);

    useEffect(() => {
        const fetchDevices = async () => {
            dispatch(setLoading(true));
            try {
                const response = await fetch(`${BACKEND_URL}/api/user/trackers`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) {
                    dispatch(setError(data.message || 'Failed to fetch trackers'));
                    return;
                }
                dispatch(setTrackers(data));
                localStorage.setItem('trackers', JSON.stringify(data));

                if (Array.isArray(data) && data.length > 0) {
                    dispatch(selectTracker(data[0].tracker._id));
                }
            } catch (error) {
                dispatch(setError(error.toString()));
            } finally {
                dispatch(setLoading(false));
            }
        };

        if (token) fetchDevices();
    }, [dispatch, token]);

    return (
        <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
            <MobileHeader setSidebarOpen={setSidebarOpen} />
            <Sidebar setTab={setTab} setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} tab={tab} />
            <MainContent tab={tab} setTab={setTab} selectedDevice={selectedDevice} selectedTrackerId={selectedTrackerId} path={path} latest={latest} deviceDetails= {deviceDetails} />
        </div>
    );
}