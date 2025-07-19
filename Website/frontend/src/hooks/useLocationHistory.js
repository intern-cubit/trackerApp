// src/hooks/useLocationHistory.js
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

export function useLocationHistory(trackerId, from, to) {
    const token = useSelector((state) => state.auth.token);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    useEffect(() => {
        if (!trackerId) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                if (from) params.append("from", from.toISOString());
                if (to) params.append("to", to.toISOString());

                const res = await fetch(
                    `${BACKEND_URL}/api/user/trackers/${trackerId}/history`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            from: from ? from.toISOString() : null,
                            to: to ? to.toISOString() : null,
                        }),
                    }
                );

                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.message || "Failed to fetch history");
                setHistory(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [trackerId, from, to, token]);

    return { history, loading, error };
}
