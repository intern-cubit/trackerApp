// backend/routes/userRoutes.js
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from '../middleware/multer.js';
import {
    assignTracker,
    getUserTrackers,
    getLiveLocation,
    getHistory,
    customizeTracker,
    unassignTracker,
    updateGeofencing,
    updateUser,
    updatePassword,
    updateNotificationPreferences,
    validateDeviceCode,
    completeDeviceRegistration,
    validateActivationKey,
    registerMobileDevice,
    activateDevice,
} from "../controllers/userController.js";


const router = Router();

// Routes that require authentication
router.get("/trackers", authMiddleware, getUserTrackers);
router.get("/trackers/:id/live", authMiddleware, getLiveLocation);
router.post("/trackers/:id/history", authMiddleware, getHistory);
router.post("/assign-tracker", authMiddleware, assignTracker);
router.post("/trackers/:id/geo-location", authMiddleware, updateGeofencing)
router.put("/update-user", authMiddleware, upload.single('userProfilePic'), updateUser)
router.put("/updatepassword", authMiddleware, updatePassword);
router.put('/update-notifications', authMiddleware, updateNotificationPreferences);
router.put("/trackers/:id/customize", authMiddleware, upload.single('deviceProfilePic'), customizeTracker);
router.delete("/trackers/:id/unassign", authMiddleware, unassignTracker);

// Mobile device registration routes (no auth required for mobile devices)
router.post("/validate-device-code", validateDeviceCode);
router.post("/register-mobile-device", registerMobileDevice);
router.post("/activate-device", activateDevice);

// Legacy routes
router.post("/devices/validate-code", authMiddleware, validateDeviceCode);
router.post("/devices/complete-registration", authMiddleware, completeDeviceRegistration);

// Public route for mobile app activation (no auth required)
router.post("/devices/validate-activation", validateActivationKey);

export default router;
