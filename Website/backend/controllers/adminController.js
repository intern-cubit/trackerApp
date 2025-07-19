// backend/controllers/adminController.js
import GpsTracker from "../models/GpsTracker.js";

// GET all trackers
export const getTrackers = async (req, res) => {
    try {
        const trackers = await GpsTracker.find();
        res.json(trackers);
    } catch (err) {
        console.error("Get Trackers error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const createTracker = async (req, res) => {
    const { deviceId, activationKey } = req.body;
    try {
        const existing = await GpsTracker.findOne({ deviceId });
        if (existing) {
            return res
                .status(400)
                .json({ message: "Tracker already exists for this Device ID" });
        }

        const tracker = new GpsTracker({
            deviceId,
            device: {
                activationKey,
                manifacturingDate: new Date(),
                activationStatus: "inactive",
                paymentStatus: "unpaid",
                expirationDate: null,
            },
            vehicle: {}, 
            geoFence: {}, 
        });

        await tracker.save();
        res.status(201).json(tracker);
    } catch (error) {
        console.error("Create Tracker error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const updateTracker = async (req, res) => {
    const { id } = req.params;
    const { deviceId, activationKey, activationStatus, expirationDate } =
        req.body;

    try {
        const tracker = await GpsTracker.findById(id);
        if (!tracker) {
            return res.status(404).json({ message: "Tracker not found" });
        }

        if (deviceId) {
            tracker.deviceId = deviceId;
        }

        if (activationKey) {
            tracker.device.activationKey = activationKey;
        }

        if (activationStatus !== undefined && activationStatus !== "") {
            const validStatuses = ["active", "inactive"];
            if (!validStatuses.includes(activationStatus)) {
                return res
                    .status(400)
                    .json({ message: "Invalid activation status" });
            }
            tracker.device.activationStatus = activationStatus;
        }

        if (expirationDate !== undefined && expirationDate !== "") {
            const parsedDate = new Date(expirationDate);
            if (isNaN(parsedDate.getTime())) {
                return res
                    .status(400)
                    .json({ message: "Invalid expiration date" });
            }
            tracker.device.expirationDate = parsedDate;
        }

        await tracker.save();
        res.json(tracker);
    } catch (error) {
        console.error("Update Tracker error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// DELETE tracker by ID
export const deleteTracker = async (req, res) => {
    const { id } = req.params;

    try {
        const tracker = await GpsTracker.findByIdAndDelete(id);
        if (!tracker) {
            return res.status(404).json({ message: "Tracker not found" });
        }
        res.json({ message: "Tracker deleted successfully" });
    } catch (error) {
        console.error("Delete Tracker error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
