import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../slices/authSlice';
import trackerSlice from '../slices/trackerSlice';
import securitySlice from '../slices/securitySlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    tracker: trackerSlice,
    security: securitySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
