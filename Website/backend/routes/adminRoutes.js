// backend/routes/adminRoutes.js
import { Router } from "express";
import {
    createTracker,
    updateTracker,
    deleteTracker,
    getTrackers,
} from "../controllers/adminController.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = Router();

// In production, add authentication/authorization for admin routes
router.get("/get-trackers", adminMiddleware, getTrackers);
router.post("/gps-trackers", adminMiddleware, createTracker);
router.put("/gps-trackers/:id", adminMiddleware, updateTracker);
router.delete("/gps-trackers/:id", adminMiddleware, deleteTracker);

export default router;
