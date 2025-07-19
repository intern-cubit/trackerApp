import { createSlice } from "@reduxjs/toolkit";

const trackerSlice = createSlice({
    name: "tracker",
    initialState: {
        trackers: [],
        selectedTrackerId: null,
        loading: false,
        error: null,
    },

    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },

        setError: (state, action) => {
            state.error = action.payload;
        },

        setTrackers: (state, action) => {
            if (Array.isArray(action.payload)) {
                state.trackers = action.payload;

                // If no tracker is selected, select the first one
                if (!state.selectedTrackerId && action.payload.length > 0) {
                    state.selectedTrackerId = action.payload[0].tracker._id;
                }
            } else {
                console.error("Payload is not an array:", action.payload);
            }
        },

        addTracker: (state, action) => {
            const newTracker = action.payload;

            let formattedTracker;

            if (newTracker._id) {
                formattedTracker = {
                    tracker: newTracker,
                    latest: {
                        location: {
                            latitude: 0,
                            longitude: 0,
                            timestamp: Date.now(),
                        },
                    },
                    status: "inactive",
                    battery: 0,
                    main: false,
                    timestamp: Date.now(),
                    diff: 0,
                    location: { latitude: 0, longitude: 0 },
                };
            } else if (newTracker.tracker && newTracker.tracker._id) {
                // If the payload is already formatted correctly
                formattedTracker = newTracker;
            } else {
                console.error("Invalid tracker format:", newTracker);
                return;
            }

            // Check if tracker already exists
            const exists = state.trackers.some(
                (item) => item.tracker._id === formattedTracker.tracker._id
            );

            if (!exists) {
                // Add the new tracker to the array
                state.trackers.push(formattedTracker);

                // If this is the first tracker, select it
                if (state.trackers.length === 1 || !state.selectedTrackerId) {
                    state.selectedTrackerId = formattedTracker.tracker._id;
                    localStorage.setItem(
                        "selectedTrackerId",
                        formattedTracker.tracker._id
                    );
                }
            }
        },

        selectTracker: (state, action) => {
            state.selectedTrackerId = action.payload;
            localStorage.setItem("selectedTrackerId", action.payload);
        },

        updateTracker: (state, action) => {
            const { trackerId, updatedDetails } = action.payload;

            const trackerIndex = state.trackers.findIndex(
                (tracker) => tracker.tracker._id === trackerId
            );

            if (trackerIndex !== -1) {
                // Deep clone the tracker and merge updated details
                state.trackers[trackerIndex] = {
                    ...state.trackers[trackerIndex],
                    tracker: {
                        ...state.trackers[trackerIndex].tracker,
                        ...updatedDetails,
                    },
                };
            }
        },

        removeTracker: (state, action) => {
            const trackerIdToRemove = action.payload;

            // Remove the tracker from the array
            state.trackers = state.trackers.filter(
                (tracker) => tracker.tracker._id !== trackerIdToRemove
            );

            // If the removed tracker was the selected one, select another or set to null
            if (state.selectedTrackerId === trackerIdToRemove) {
                state.selectedTrackerId =
                    state.trackers.length > 0
                        ? state.trackers[0].tracker._id
                        : null;
            }
        },

        updateTrackerLocation: (state, action) => {
            const {
                trackerId,
                latitude,
                longitude,
                timestamp,
                status,
                battery,
                main,
                diff,
            } = action.payload;

            const trackerIndex = state.trackers.findIndex(
                (tracker) => tracker.tracker._id === trackerId
            );

            if (trackerIndex !== -1) {
                const updatedTrackers = state.trackers.map((tracker) => {
                    if (tracker.tracker._id === trackerId) {
                        return {
                            ...tracker,
                            latest: {
                                location: {
                                    latitude,
                                    longitude,
                                    timestamp,
                                },
                            },
                            status,
                            battery,
                            main,
                            timestamp,
                            diff,
                            location: { latitude, longitude },
                        };
                    }
                    return tracker;
                });

                state.trackers = updatedTrackers;
            } else {
                console.warn(
                    `Tracker with ID ${trackerId} not found in state.`
                );
            }
        },
    },
});

export const {
    setLoading,
    setError,
    setTrackers,
    addTracker,
    selectTracker,
    updateTracker,
    removeTracker,
    updateTrackerLocation,
} = trackerSlice.actions;

export default trackerSlice.reducer;
