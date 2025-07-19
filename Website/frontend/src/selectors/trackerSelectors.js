// src/selectors/trackerSelectors.js

// Get full list of trackers
export const selectAllTrackers = (state) => state.tracker.trackers;

// Get selected tracker entry
export const selectSelectedTracker = (state) =>
    state.tracker.trackers.find(
        (e) => e.tracker.deviceId === state.tracker.selectedTrackerId
    ) || null;
