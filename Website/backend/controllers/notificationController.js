import Notification from "../models/Notification.js";

export const fetchNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await Notification.find({ userId }).sort({
            timestamp: -1,
        });
        res.json({ success: true, items });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const readNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.updateMany(
            { userId, read: false },
            { $set: { read: true } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
