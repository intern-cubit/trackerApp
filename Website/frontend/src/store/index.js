import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import trackerReducer from "../features/trackerSlice";
import notificationsReducer from "../features/notificationSlice"
import themeReducer from "../features/themeSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tracker: trackerReducer,
        theme: themeReducer,
        notifications: notificationsReducer,
    },
});
