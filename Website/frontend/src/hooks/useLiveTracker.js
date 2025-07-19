import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
    updateTrackerLocation,
    setError,
    setLoading,
} from "../features/trackerSlice";
import io from "socket.io-client";

export function useLiveTracker() {
    const dispatch = useDispatch();
    const [trackerId, setTrackerId] = useState(
        localStorage.getItem("selectedTrackerId")
    );
    const [path, setPath] = useState([]);
    const [latest, setLatest] = useState(null);
    const [deviceDetails, setDeviceDetails] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentId = localStorage.getItem("selectedTrackerId");
            if (currentId !== trackerId) {
                setTrackerId(currentId);
            }
        }, 500); 

        return () => clearInterval(interval);
    }, [trackerId]);

    useEffect(() => {
        if (!trackerId) return;

        const BACKEND =
            import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

        if (socketRef.current) {
            socketRef.current.off("liveLocation");
            socketRef.current.disconnect();
        }

        // Reset state
        setPath([]);
        setLatest(null);
        setDeviceDetails(null);

        const fetchInitial = async () => {
            dispatch(setLoading(true));
            try {
                const res = await fetch(
                    `${BACKEND}/api/user/trackers/${trackerId}/live`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(
                        err.message || "Failed to fetch initial location"
                    );
                }

                const { latest, status } = await res.json();
                const {
                    latitude,
                    longitude,
                    main,
                    battery,
                    timestamp,
                } = latest;

                dispatch(
                    updateTrackerLocation({
                        deviceId: trackerId,
                        latitude,
                        longitude,
                        timestamp,
                        status,
                        main,
                        battery,
                    })
                );

                setLatest([latitude, longitude]);
                setDeviceDetails({ main, battery, timestamp });
                setPath([[latitude, longitude]]);
            } catch (err) {
                console.error("Error fetching initial live location:", err);
                dispatch(setError(err.message));
            } finally {
                dispatch(setLoading(false));
            }
        };

        fetchInitial();

        dispatch(setLoading(true));
        const socket = io(BACKEND, {
            auth: { token: localStorage.getItem("token") },
        });

        socketRef.current = socket;

        socket.emit("subscribeTracker", trackerId);

        socket.on("liveLocation", (data) => {
            if (data.trackerId !== trackerId) return;

            const {
                latitude,
                longitude,
                timestamp,
                main,
                battery,
            } = data;

            dispatch(
                updateTrackerLocation({
                    deviceId: trackerId,
                    latitude,
                    longitude,
                    timestamp,
                    status: "online",
                    main,
                    battery,
                })
            );

            setLatest([latitude, longitude]);
            setDeviceDetails({ main, battery, timestamp });
            setPath((prev) => {
                const last = prev[prev.length - 1] || [];
                if (last[0] === latitude && last[1] === longitude) return prev;
                return [...prev, [latitude, longitude]];
            });
        });

        socket.on("connect_error", (err) => {
            console.error("Live socket error", err);
            dispatch(setError(err.message));
        });

        socket.on("disconnect", () => {
            dispatch(setLoading(false));
        });

        return () => {
            socket.off("liveLocation");
            socket.disconnect();
            dispatch(setLoading(false));
        };
    }, [dispatch, trackerId]);

    return { path, latest, deviceDetails };
}
