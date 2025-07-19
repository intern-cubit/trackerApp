// backend/models/GpsTracker.js
import mongoose from "mongoose";

const deviceMetadataSchema = new mongoose.Schema(
    {
        manifacturingDate: { type: Date, default: Date.now },
        activationKey: { type: String, required: true },
        activationStatus: {
            type: String,
            enum: ["active", "inactive", "pending"],
            default: "inactive",
        },
        paymentStatus: {
            type: String,
            enum: ["paid", "unpaid"],
            default: "unpaid",
        },
        expirationDate: {
            type: Date,
            default: null,
        },
        deviceName: { type: String, default: "Unknown Device" },
        mobile: { type: String, default: "Unknown Mobile" },
        profilePic: {
            type: String,
        },
        // New fields for mobile device support
        deviceType: {
            type: String,
            enum: ["tracker", "mobile"],
            default: "tracker",
        },
        platform: {
            type: String,
            enum: ["ios", "android", "mobile", "unknown"],
            default: "unknown",
        },
    },
    { _id: false }
);

const gpsTrackerSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
            required: true,
            unique: true, // IMEI
        },
        device: deviceMetadataSchema,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        // Enhanced security settings
        securitySettings: {
            maxFailedAttempts: {
                type: Number,
                default: 3,
            },
            autoLockEnabled: {
                type: Boolean,
                default: true,
            },
            movementLockEnabled: {
                type: Boolean,
                default: false,
            },
            dontTouchLockEnabled: {
                type: Boolean,
                default: false,
            },
            usbLockEnabled: {
                type: Boolean,
                default: false,
            },
            appLockEnabled: {
                type: Boolean,
                default: false,
            },
            sosEnabled: {
                type: Boolean,
                default: true,
            },
            remoteWipeEnabled: {
                type: Boolean,
                default: false,
            },
            preventUninstall: {
                type: Boolean,
                default: true,
            },
            movementSensitivity: {
                type: Number,
                default: 1.5,
                min: 0.1,
                max: 5.0,
            },
        },

        // Device status
        deviceStatus: {
            isOnline: {
                type: Boolean,
                default: false,
            },
            isLocked: {
                type: Boolean,
                default: false,
            },
            lastSeen: Date,
            batteryLevel: Number,
            storageInfo: {
                free: Number,
                total: Number,
                used: Number,
            },
            appVersion: String,
            osVersion: String,
            failedLoginAttempts: {
                type: Number,
                default: 0,
            },
        },

        // Performance settings
        performanceSettings: {
            autoClearCache: {
                type: Boolean,
                default: true,
            },
            cacheCleanInterval: {
                type: Number,
                default: 24, // hours
            },
            backgroundAppLimit: {
                type: Number,
                default: 5,
            },
            batteryOptimization: {
                type: Boolean,
                default: true,
            },
        },

        // Media capture settings
        mediaCaptureSettings: {
            photoQuality: {
                type: Number,
                default: 0.8,
                min: 0.1,
                max: 1.0,
            },
            videoQuality: {
                type: String,
                enum: ["480p", "720p", "1080p"],
                default: "720p",
            },
            maxVideoLength: {
                type: Number,
                default: 30, // seconds
            },
            autoUpload: {
                type: Boolean,
                default: true,
            },
            storageLimit: {
                type: Number,
                default: 500, // MB
            },
        },
    },
    { timestamps: true }
);

export default mongoose.model("GpsTracker", gpsTrackerSchema);
