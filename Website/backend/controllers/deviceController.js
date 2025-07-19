// File: backend/controllers/deviceController.js
import LatestLocation from "../models/LatestLocation.js";
import LocationHistory from "../models/LocationHistory.js";
import GpsTracker from "../models/GpsTracker.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendGeofenceAlert } from "../utils/sendGeofenceAlerts.js";

export const locationUpdate = async (req, res) => {
    const {
        deviceName,
        latitude,
        longitude,
        date,
        time,
        inputVoltage,
        batteryVoltage,
        alert,
    } = req.body;

    try {
        const deviceId = deviceName.replace("-", "")
        // For mobile devices, deviceName could be the device code with dashes
        // First try to find by deviceId (without dashes)
        let tracker = await GpsTracker.findOne({ deviceId: deviceId });
        
        // If not found, try with device code (for mobile devices)
        if (!tracker) {
            tracker = await GpsTracker.findOne({ 'deviceId': deviceName });
        }
        
        // If still not found, try direct deviceName match
        if (!tracker) {
            tracker = await GpsTracker.findOne({ deviceId: deviceName });
        }
        
        if (!tracker) {
            return res.status(400).json({ message: "Invalid Device ID" });
        }

        const trackerId = tracker._id.toString();
        const userId = tracker.userId?.toString();
        const user = await User.findOne({ _id: tracker.userId });
        if (!user) {
            return res.status(400).json({ message: "Invalid User ID" });
        }
        const ts = new Date(`${date}T${time}`);

        const updateData = {
            timestamp: ts,
            latitude,
            longitude,
            main: inputVoltage,
            battery: batteryVoltage,
        };

        await LatestLocation.findOneAndUpdate({ trackerId }, updateData, {
            upsert: true,
            new: true,
        });

        await new LocationHistory({
            trackerId,
            ...updateData,
        }).save();

        if (alert) {
            const vehicleName = tracker.vehicle?.name || "Unknown Vehicle";
            const vehicleNumber = tracker?.vehicle?.number;
            const message = `🚨 ${vehicleName} crossed geofence at ${date}, ${time}`;

            const newNotif = await new Notification({ userId, message }).save();

            req.app.get("io").to(userId).emit("alertNotification", {
                message,
                timestamp: newNotif.timestamp,
                read: false,
            });
        }

        req.app
            .get("io")
            .to(`tracker_${trackerId}`)
            .emit("liveLocation", {
                trackerId,
                latitude,
                longitude,
                timestamp: ts,
                main: inputVoltage,
                battery: batteryVoltage,
            });

        return res.json({ success: true, message: "Location updated" });
    } catch (error) {
        console.error("locationUpdate error:", error);
        return res.status(500).json({ message: "Server Error" });
    }
};

export const getactivationStatus = async (req, res) => {
    const { deviceName } = req.body;

    try {
        const tracker = await GpsTracker.findOne({ deviceId: deviceName });
        if (!tracker) {
            return res.status(400).json({ message: "Invalid Device ID" });
        }

        const activationStatus = tracker.device?.activationStatus || "inactive";
        const activation = activationStatus === "active" ? 1 : 0;
        const expirationDate = tracker.device?.expirationDate || null;

        res.json({
            imei: deviceName,
            activation,
            validity: expirationDate
                ? expirationDate.toISOString().split("T")[0]
                : null,
        });
    } catch (error) {
        console.error("Device Activation Status error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const checkExpiredDevices = async (req, res) => {
    try {
        const now = new Date();

        const expiredDevices = await GpsTracker.find({
            "device.expirationDate": { $lte: now },
        });

        if (expiredDevices.length === 0) {
            return res.json({
                message: "No expired devices found",
                success: true,
            });
        }

        const updates = expiredDevices.map(async (tracker) => {
            tracker.device.paymentStatus = "unpaid";
            tracker.device.activationStatus = "inactive";
            return tracker.save();
        });

        await Promise.all(updates);

        res.json({
            message: "Expired devices updated successfully",
            success: true,
            count: expiredDevices.length,
        });
    } catch (error) {
        console.error("Check Expired Devices error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const deviceData = async (req, res) => {
    const data = req.body;

    if (!data) {
        return res.status(400).json({
            success: false,
            message: "No data received",
        });
    }
    res.status(200).json({
        success: true,
        message: "Data received successfully",
        data: data,
    });
};

export const getDeviceByCode = async (req, res) => {
    try {
        const { deviceCode } = req.params;
        const userId = req.user.id;

        // Find device by device code (without dashes) and user
        const device = await GpsTracker.findOne({ 
            deviceId: deviceCode,
            userId: userId 
        });

        if (!device) {
            return res.status(404).json({
                success: false,
                message: "Device not found"
            });
        }

        res.status(200).json({
            success: true,
            device: {
                _id: device._id,
                deviceId: device.deviceId,
                deviceName: device.deviceName,
                isActive: device.isActive
            }
        });
    } catch (error) {
        console.error('Error getting device by code:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
