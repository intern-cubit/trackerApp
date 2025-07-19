// File: backend/routes/notificationRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { fetchNotifications, readNotifications } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", authMiddleware, fetchNotifications);
router.post("/mark-read", authMiddleware, readNotifications);

export default router;
