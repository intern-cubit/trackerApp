import { useDispatch } from "react-redux";
import { selectTracker, setError, setLoading, setTrackers } from "../features/trackerSlice";

const fetchDevices = async () => {
    const dispatch = useDispatch()
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
            dispatch(setError(data.message || "Failed to fetch trackers"));
            return;
        }
        dispatch(setTrackers(data));
        localStorage.setItem("trackers", JSON.stringify(data));

        if (Array.isArray(data) && data.length > 0) {
            dispatch(selectTracker(data[0].tracker._id));
        }
    } catch (error) {
        dispatch(setError(error.toString()));
    } finally {
        dispatch(setLoading(false));
    }
};

export default fetchDevices