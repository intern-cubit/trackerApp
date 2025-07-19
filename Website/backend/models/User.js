import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        email: {
            deviceStatusUpdates: { type: Boolean, default: true },
            geofenceAlerts: { type: Boolean, default: true },
        },
        sms: {
            deviceStatusUpdates: { type: Boolean, default: false },
            geofenceAlerts: { type: Boolean, default: false },
        },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            default: "",
        },
        profilePic: {
            type: String,
            default: "",
        },
        passwordHash: {
            type: String,
            required: true,
        },
        trackers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "GpsTracker",
            },
        ],
        notifications: {
            type: notificationSchema,
            default: () => ({}), // ensures default is applied
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
