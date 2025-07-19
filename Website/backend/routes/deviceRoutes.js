// backend/routes/deviceRoutes.js
import { Router } from "express";
import { checkExpiredDevices, deviceData, getactivationStatus, locationUpdate, getDeviceByCode } from "../controllers/deviceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// This endpoint is public since it is used by the device for location updates
router.get("/expiration-status", checkExpiredDevices); // This endpoint is public since it is used by the device for expiration status updates
router.post("/device-data", deviceData);
router.post("/location", locationUpdate);
router.post("/activation-status", getactivationStatus); // This endpoint is public since it is used by the device for activation status updates

// Protected route to get device by code
router.get("/by-code/:deviceCode", authMiddleware, getDeviceByCode);

export default router;