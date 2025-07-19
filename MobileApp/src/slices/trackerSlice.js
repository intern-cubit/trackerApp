import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  devices: [],
  currentLocation: null,
  locationHistory: [],
  selectedDevice: null,
  isTracking: false,
  loading: false,
  error: null,
};

const trackerSlice = createSlice({
  name: 'tracker',
  initialState,
  reducers: {
    setDevices: (state, action) => {
      state.devices = action.payload;
    },
    addDevice: (state, action) => {
      state.devices.push(action.payload);
    },
    updateDevice: (state, action) => {
      const index = state.devices.findIndex(d => d._id === action.payload._id);
      if (index !== -1) {
        state.devices[index] = action.payload;
      }
    },
    removeDevice: (state, action) => {
      state.devices = state.devices.filter(d => d._id !== action.payload);
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    addLocationHistory: (state, action) => {
      state.locationHistory.push(action.payload);
    },
    setSelectedDevice: (state, action) => {
      state.selectedDevice = action.payload;
    },
    setTracking: (state, action) => {
      state.isTracking = action.payload;
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
  setDevices,
  addDevice,
  updateDevice,
  removeDevice,
  setCurrentLocation,
  addLocationHistory,
  setSelectedDevice,
  setTracking,
  setLoading,
  setError,
  clearError,
} = trackerSlice.actions;

export default trackerSlice.reducer;
