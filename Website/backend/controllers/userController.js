// backend/controllers/userController.js
import GpsTracker from "../models/GpsTracker.js";
import LatestLocation from "../models/LatestLocation.js";
import LocationHistory from "../models/LocationHistory.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Helper function to generate deterministic activation key
const generateActivationKey = (deviceCode, userId) => {
    const input = `${deviceCode}-${userId}-activation`;
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    // Convert to uppercase alphanumeric and format as XXXX-XXXX
    const key = hash.substring(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '0');
    return `${key.substring(0, 4)}-${key.substring(4, 8)}`;
};

export const assignTracker = async (req, res) => {
    const { deviceId, activationKey, deviceName, autoRegistered, deviceType, platform } = req.body;
    const userId = req.user.id;
    console.log('Assign tracker request:', { deviceId, activationKey, deviceName, autoRegistered });
    
    try {
        // Check if this is an auto-registration for mobile device
        if (autoRegistered && deviceType === 'mobile') {
            // For mobile auto-registration, create a new tracker entry
            const newTracker = new GpsTracker({
                deviceId,
                userId,
                device: {
                    deviceName: deviceName || 'Mobile Device',
                    mobile: '',
                    activationKey,
                    activationStatus: 'active',
                    paymentStatus: 'paid',
                    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                    deviceType: deviceType || 'mobile',
                    platform: platform || 'unknown',
                    profilePic: null
                },
                deviceStatus: {
                    isOnline: true,
                    lastSeen: new Date(),
                    batteryLevel: 100,
                    storageInfo: {},
                    appVersion: '1.0.0'
                },
                lastLocation: {
                    latitude: 0,
                    longitude: 0,
                    timestamp: new Date()
                }
            });

            await newTracker.save();

            await User.findByIdAndUpdate(userId, {
                $push: { trackers: newTracker._id },
            });

            return res.status(201).json({
                message: "Mobile device registered successfully",
                tracker: newTracker,
                autoRegistered: true
            });
        }

        // Check if this is a mobile device activation
        const mobileTracker = await GpsTracker.findOne({
            'device.activationKey': activationKey,
            'device.deviceType': 'mobile'
        });

        if (mobileTracker) {
            // This is a mobile device activation
            if (mobileTracker.userId && mobileTracker.userId.toString() !== userId) {
                return res.status(400).json({ 
                    message: "This activation key belongs to another user" 
                });
            }

            // Activate the mobile device
            mobileTracker.device.activationStatus = 'active';
            mobileTracker.deviceStatus.isOnline = true;
            mobileTracker.deviceStatus.lastSeen = new Date();
            
            if (deviceName) {
                mobileTracker.device.deviceName = deviceName;
            }

            await mobileTracker.save();

            return res.json({ 
                message: "Mobile device activated successfully", 
                tracker: mobileTracker 
            });
        }

        // Original logic for regular trackers
        const tracker = await GpsTracker.findOne({
            deviceId,
            "device.activationKey": activationKey,
        });

        if (!tracker) {
            return res
                .status(400)
                .json({ message: "Invalid Device ID or Activation Key" });
        }

        if (!tracker.userId) {
            tracker.userId = userId;
            tracker.device.activationStatus = "active";
            tracker.device.paymentStatus = "paid";
            tracker.device.expirationDate = new Date(
                Date.now() + 365 * 24 * 60 * 60 * 1000
            );

            if (deviceName) {
                tracker.device.deviceName = deviceName;
            }

            await tracker.save();

            await User.findByIdAndUpdate(userId, {
                $push: { trackers: tracker._id },
            });
        }

        res.json({ message: "Tracker assigned successfully", tracker });
    } catch (error) {
        console.error("Assign Tracker error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const unassignTracker = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const tracker = await GpsTracker.findById({ _id: id });
        if (!tracker)
            return res.status(404).json({ message: "Tracker not found" });

        if (tracker.userId?.toString() === userId) {
            tracker.userId = null;
            tracker.device.activationStatus = "inactive";
            tracker.device.paymentStatus = "unpaid";
            tracker.device.expirationDate = null;

            await tracker.save();

            await User.findByIdAndUpdate(userId, {
                $pull: { trackers: tracker._id },
            });
        }
        res.json({ message: "Tracker unassigned successfully", tracker });
    } catch (error) {
        console.error("Unassign Tracker error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const updateUser = async (req, res) => {
    const userId = req.user?.id;

    try {
        const { fullName, username, phone } = req.body;
        let profilePic = null;

        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(
                req.file.path,
                {
                    folder: "user_profiles",
                }
            );
            profilePic = uploadResult.secure_url;
        }

        const updatedFields = {
            ...(fullName && { fullName }),
            ...(username && { username }),
            ...(phone && { phone }),
            ...(profilePic && { profilePic }),
        };

        const updatedUser = await User.findByIdAndUpdate(
            { _id: userId },
            { $set: updatedFields },
            { new: true }
        ).select("-passwordHash");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error at updateUser:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const updatePassword = async (req, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Both currentPassword and newPassword are required.",
        });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.passwordHash
        );
        const isNewMatch = await bcrypt.compare(newPassword, user.passwordHash);
        if (!isMatch) {
            return res
                .status(401)
                .json({ message: "Current password is incorrect." });
        }
        if (isNewMatch) {
            return res.status(401).json({
                message: "New Password cannot be as same the old password.",
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.passwordHash = hashedPassword;
        await user.save();

        return res
            .status(200)
            .json({ message: "Password updated successfully." });
    } catch (error) {
        console.error("Error in updatePassword:", error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

export const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationEmail, notificationSMS } = req.body;

        if (
            (notificationEmail !== undefined &&
                (!Array.isArray(notificationEmail) ||
                    notificationEmail.length !== 2)) ||
            (notificationSMS !== undefined &&
                (!Array.isArray(notificationSMS) ||
                    notificationSMS.length !== 2))
        ) {
            return res
                .status(400)
                .json({ message: "Invalid notification preferences format" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.notifications = user?.notifications || {};
        if (
            Array.isArray(notificationEmail) &&
            notificationEmail.length === 2
        ) {
            user.notifications.email = {
                deviceStatusUpdates: Boolean(notificationEmail[0]),
                geofenceAlerts: Boolean(notificationEmail[1]),
            };
        } else {
            user.notifications.email = {
                deviceStatusUpdates: false,
                geofenceAlerts: false,
            };
        }

        if (Array.isArray(notificationSMS) && notificationSMS.length === 2) {
            user.notifications.sms = {
                deviceStatusUpdates: Boolean(notificationSMS[0]),
                geofenceAlerts: Boolean(notificationSMS[1]),
            };
        } else {
            user.notifications.sms = {
                deviceStatusUpdates: false,
                geofenceAlerts: false,
            };
        }

        await user.save();

        res.json({ user });
    } catch (err) {
        console.error("Error updating notifications:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const customizeTracker = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const { deviceName, deviceNumber } = req.body;
        let profilePicUrl = null;

        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(
                req.file.path,
                {
                    folder: "device_profiles",
                }
            );
            profilePicUrl = uploadResult.secure_url;
        }

        const updateFields = {
            ...(deviceName !== undefined && { "device.deviceName": deviceName }),
            ...(deviceNumber !== undefined && {
                "device.mobile": deviceNumber,
            }),
            ...(profilePicUrl && { "device.profilePic": profilePicUrl }),
        };

        const updatedTracker = await GpsTracker.findOneAndUpdate(
            { _id: id, userId },
            { $set: updateFields },
            { new: true }
        );

        if (!updatedTracker) {
            return res.status(404).json({ message: "Device not found" });
        }

        res.status(200).json({
            message: "Device updated",
            device: updatedTracker,
        });
    } catch (error) {
        console.error("Customize Tracker error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateGeofencing = async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const { radius, homeLatitude, homeLongitude } = req.body;
        const updateFields = {
            // Only set radius if it’s explicitly provided
            ...(radius !== undefined && { "geoFence.radius": radius }),
            // Ditto for homeLatitude
            ...(homeLatitude !== undefined && {
                "geoFence.homeLatitude": homeLatitude,
            }),
            // Make sure you check homeLongitude !== undefined
            ...(homeLongitude !== undefined && {
                "geoFence.homeLongitude": homeLongitude,
            }),
            // Always flip this on when updating geofence
            "geoFence.isActive": true,
        };

        const updatedTracker = await GpsTracker.findOneAndUpdate(
            { _id: id, userId },
            { $set: updateFields },
            { new: true }
        );

        if (!updatedTracker) {
            return res.status(404).json({ message: "Device not found" });
        }

        res.status(200).json({
            message: "Device updated",
            ...updateFields,
        });
    } catch (error) {
        console.error("Update geofence:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserTrackers = async (req, res) => {
    const userId = req.user.id;
    try {
        const trackers = await GpsTracker.find({ userId });
        const trackersWithStatus = await Promise.all(
            trackers.map(async (tracker) => {
                const latest = await LatestLocation.findOne({
                    trackerId: tracker._id,
                });
                let status = "offline";
                if (latest) {
                    const diff =
                        Date.now() - new Date(latest.timestamp).getTime();
                    status = diff <= 60000 ? "online" : "offline";
                }
                return { tracker, latest, status };
            })
        );
        res.json(trackersWithStatus);
    } catch (error) {
        console.error("Get Trackers error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getLiveLocation = async (req, res) => {
    const { id } = req.params;
    try {
        const latest = await LatestLocation.findOne({ trackerId: id });
        if (!latest)
            return res
                .status(404)
                .json({ message: "No live data for this tracker" });

        const diff = Date.now() - new Date(latest.timestamp).getTime();
        const status = diff <= 60000 ? "online" : "offline";
        res.json({ latest, status, diff });
    } catch (error) {
        console.error("Live Location error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getHistory = async (req, res) => {
    const { id } = req.params;
    const { from, to } = req.body;
    const filter = { trackerId: id };

    if (from || to) {
        filter.timestamp = {};
        if (from) filter.timestamp.$gte = new Date(from);
        if (to) filter.timestamp.$lte = new Date(to);
    }

    try {
        const history = await LocationHistory.find(filter).sort({
            timestamp: 1,
        });
        res.json(history);
    } catch (error) {
        console.error("History Playback error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Validate device code for mobile registration (no auth required)
export const validateDeviceCode = async (req, res) => {
    const { deviceCode, deviceName } = req.body;
    const userId = req.user?.id; // Optional for authenticated users

    try {
        console.log('Validating device code:', deviceCode, 'User ID:', userId);
        
        // Validate code format: 123456789012 (12 digits, no hyphens)
        const codePattern = /^\d{12}$/;
        if (!codePattern.test(deviceCode)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid code format. Expected format: 12-digit code without hyphens' 
            });
        }

        // Check if device exists - look by deviceId first, then by device.deviceCode
        let tracker = await GpsTracker.findOne({ 
            'deviceId': deviceCode
        });

        // If not found by deviceId, try looking by device.deviceCode (for mobile devices)
        if (!tracker) {
            tracker = await GpsTracker.findOne({ 
                'deviceId': deviceCode
            });
        }

        if (!tracker) {
            return res.status(404).json({ 
                success: false,
                message: 'Device not found. Please register the device first.' 
            });
        }

        // If user is authenticated and device is not assigned, assign it to the user
        if (userId && !tracker.userId) {
            console.log('Assigning device to user:', userId);
            
            // Generate activation key
            const activationKey = generateActivationKey(deviceCode, userId);
            
            // Assign device to user
            tracker.userId = userId;
            tracker.device.activationKey = activationKey;
            tracker.device.activationStatus = 'pending';
            tracker.device.paymentStatus = 'paid';
            tracker.device.expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
            
            if (deviceName) {
                tracker.device.deviceName = deviceName;
            }

            await tracker.save();

            // Add tracker to user's trackers list
            await User.findByIdAndUpdate(userId, {
                $push: { trackers: tracker._id },
            });

            return res.json({
                success: true,
                message: 'Device assigned successfully! Share the activation key with the mobile device.',
                activationKey: activationKey,
                deviceInfo: {
                    id: tracker._id,
                    deviceId: deviceCode,
                    deviceName: tracker.device.deviceName,
                    activationStatus: tracker.device.activationStatus,
                    platform: tracker.device.platform,
                    deviceType: tracker.device.deviceType
                }
            });
        }

        // If device is already assigned to another user
        if (userId && tracker.userId && tracker.userId.toString() !== userId) {
            return res.status(400).json({ 
                success: false,
                message: 'This device is already assigned to another user' 
            });
        }

        // Return device information and status (for non-authenticated or already assigned devices)
        res.json({
            success: true,
            message: 'Device found',
            device: {
                id: tracker._id,
                deviceId: deviceCode,
                deviceName: tracker.device.deviceName,
                activationStatus: tracker.device.activationStatus,
                platform: tracker.device.platform,
                deviceType: tracker.device.deviceType
            }
        });
    } catch (error) {
        console.error('Device code validation error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during validation' 
        });
    }
};

// Complete mobile device registration - now just validates that registration was done
export const completeDeviceRegistration = async (req, res) => {
    const { deviceCode, activationKey, deviceName } = req.body;
    const userId = req.user.id;

    try {
        // Find the tracker that should already exist
        const tracker = await GpsTracker.findOne({
            'deviceId': deviceCode,
            'device.activationKey': activationKey,
            userId: userId
        });

        if (!tracker) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid device code or activation key' 
            });
        }

        // Update device name if provided
        if (deviceName && deviceName !== tracker.device.deviceName) {
            tracker.device.deviceName = deviceName;
            await tracker.save();
        }

        res.json({
            success: true,
            message: 'Device confirmed successfully',
            device: {
                id: tracker._id,
                deviceId: tracker.deviceId,
                deviceName: tracker.device.deviceName,
                activationKey: tracker.device.activationKey,
                deviceType: tracker.device.deviceType,
                status: tracker.device.activationStatus
            }
        });
    } catch (error) {
        console.error('Device registration confirmation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during confirmation' 
        });
    }
};

// Validate activation key from mobile app
export const validateActivationKey = async (req, res) => {
    const { deviceCode, activationKey } = req.body;
    
    try {
        // Find tracker with matching device code and activation key
        const tracker = await GpsTracker.findOne({
            'deviceId': deviceCode,
            'device.activationKey': activationKey,
            'device.deviceType': 'mobile'
        });

        if (!tracker) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid device code or activation key' 
            });
        }

        // Activate the device
        tracker.device.activationStatus = 'active';
        tracker.deviceStatus.isOnline = true;
        tracker.deviceStatus.lastSeen = new Date();
        await tracker.save();

        res.json({
            success: true,
            message: 'Device activated successfully',
            device: {
                id: tracker._id,
                deviceId: tracker.deviceId,
                deviceName: tracker.device.deviceName,
                userId: tracker.userId,
                status: 'active'
            }
        });
    } catch (error) {
        console.error('Activation key validation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during activation' 
        });
    }
};

// Register mobile device without authentication (for mobile app first launch)
export const registerMobileDevice = async (req, res) => {
    const { deviceCode, deviceName, deviceId, platform, deviceType } = req.body;
    
    try {
        console.log('Registering mobile device:', { deviceCode, deviceName, platform });
        
        // Validate device code format
        const codePattern = /^\d{12}$/;
        if (!codePattern.test(deviceCode)) {
            return res.status(400).json({ 
                message: 'Invalid device code format. Expected format: 12-digit code without hyphens' 
            });
        }

        // Check if device already exists
        const existingTracker = await GpsTracker.findOne({
            'deviceId': deviceCode
        });

        if (existingTracker) {
            return res.status(400).json({ 
                message: 'Device code already registered. Please use a different device or contact administrator.' 
            });
        }

        // Generate a unique activation key for this device
        const activationKey = generateActivationKey(deviceCode, null);

        // Create new mobile tracker in pending state
        const newTracker = new GpsTracker({
            deviceId: deviceCode, // Use device code directly as device ID (no hyphens)
            userId: null, // Will be assigned when user activates
            device: {
                deviceName: deviceName || 'Mobile Device',
                mobile: '',
                activationKey,
                activationStatus: 'pending',
                paymentStatus: 'unpaid',
                expirationDate: null,
                deviceType: 'mobile',
                platform: platform || 'unknown',
                profilePic: null,
                deviceCode: deviceCode
            },
            deviceStatus: {
                isOnline: false,
                lastSeen: new Date(),
                batteryLevel: 0,
                storageInfo: {},
                appVersion: '1.0.0'
            },
            lastLocation: {
                latitude: 0,
                longitude: 0,
                timestamp: new Date()
            }
        });

        await newTracker.save();

        res.json({
            message: 'Mobile device registered successfully. Please share the device code with your administrator to get an activation key.',
            device: {
                id: newTracker._id,
                deviceCode: deviceCode,
                deviceName: deviceName || 'Mobile Device',
                platform: platform || 'unknown',
                status: 'pending'
            }
        });
    } catch (error) {
        console.error('Mobile device registration error:', error);
        res.status(500).json({ 
            message: 'Server error during device registration' 
        });
    }
};

// Activate device using activation key (for mobile app)
export const activateDevice = async (req, res) => {
    const { deviceCode, activationKey, deviceName } = req.body;
    
    try {
        console.log('Activating device:', { deviceCode, activationKey });
        
        // Find device with matching code and key
        const tracker = await GpsTracker.findOne({
            'deviceId': deviceCode,
            'device.activationKey': activationKey
        });

        if (!tracker) {
            return res.status(400).json({ 
                message: 'Invalid device code or activation key' 
            });
        }

        if (tracker.device.activationStatus === 'active') {
            return res.json({
                message: 'Device is already activated',
                device: {
                    id: tracker._id,
                    deviceCode: deviceCode,
                    deviceName: tracker.device.deviceName,
                    status: 'active'
                }
            });
        }

        // Activate the device
        tracker.device.activationStatus = 'active';
        tracker.device.paymentStatus = 'paid';
        tracker.device.expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        tracker.deviceStatus.isOnline = true;
        tracker.deviceStatus.lastSeen = new Date();
        
        if (deviceName) {
            tracker.device.deviceName = deviceName;
        }

        await tracker.save();

        res.json({
            message: 'Device activated successfully',
            device: {
                id: tracker._id,
                deviceCode: deviceCode,
                deviceName: tracker.device.deviceName,
                status: 'active'
            }
        });
    } catch (error) {
        console.error('Device activation error:', error);
        res.status(500).json({ 
            message: 'Server error during device activation' 
        });
    }
};
