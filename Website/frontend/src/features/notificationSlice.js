// File: frontend/src/features/notifications/notificationsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const fetchNotifications = createAsyncThunk(
    "notifications/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/notifications`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to fetch notifications");
            }
            const data = await response.json();
            return data.items; // array of { message, timestamp, read }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Mark all notifications as read on the server
export const markAllReadOnServer = createAsyncThunk(
    "notifications/markRead",
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/notifications/mark-read`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({}),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(
                    err.message || "Failed to mark notifications as read"
                );
            }
            return; // no payload needed
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const notificationsSlice = createSlice({
    name: "notifications",
    initialState: {
        items: [], // { message, timestamp, read }
        unreadCount: 0,
        loading: false,
        error: null,
    },
    reducers: {
        addNotification: (state, action) => {
            state.items.unshift({ ...action.payload, read: false });
            state.unreadCount++;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchNotifications
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.items = payload;
                state.unreadCount = payload.filter((n) => !n.read).length;
            })
            .addCase(fetchNotifications.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            })
            // markAllReadOnServer
            .addCase(markAllReadOnServer.fulfilled, (state) => {
                state.items = state.items.map((n) => ({ ...n, read: true }));
                state.unreadCount = 0;
            })
            .addCase(markAllReadOnServer.rejected, (state, { payload }) => {
                state.error = payload;
            });
    },
});

export const { addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
