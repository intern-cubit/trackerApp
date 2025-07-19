import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  events: [],
  geofences: [],
  activeAlerts: [],
  isSecureMode: false,
  lockdownEnabled: false,
  loading: false,
  error: null,
};

const securitySlice = createSlice({
  name: 'security',
  initialState,
  reducers: {
    setSecurityEvents: (state, action) => {
      state.events = action.payload;
    },
    addSecurityEvent: (state, action) => {
      state.events.unshift(action.payload);
    },
    setGeofences: (state, action) => {
      state.geofences = action.payload;
    },
    addGeofence: (state, action) => {
      state.geofences.push(action.payload);
    },
    updateGeofence: (state, action) => {
      const index = state.geofences.findIndex(g => g._id === action.payload._id);
      if (index !== -1) {
        state.geofences[index] = action.payload;
      }
    },
    removeGeofence: (state, action) => {
      state.geofences = state.geofences.filter(g => g._id !== action.payload);
    },
    setActiveAlerts: (state, action) => {
      state.activeAlerts = action.payload;
    },
    addAlert: (state, action) => {
      state.activeAlerts.push(action.payload);
    },
    removeAlert: (state, action) => {
      state.activeAlerts = state.activeAlerts.filter(a => a.id !== action.payload);
    },
    setSecureMode: (state, action) => {
      state.isSecureMode = action.payload;
    },
    setLockdown: (state, action) => {
      state.lockdownEnabled = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setSecurityEvents,
  addSecurityEvent,
  setGeofences,
  addGeofence,
  updateGeofence,
  removeGeofence,
  setActiveAlerts,
  addAlert,
  removeAlert,
  setSecureMode,
  setLockdown,
  setLoading,
  setError,
  clearError,
} = securitySlice.actions;

export default securitySlice.reducer;
