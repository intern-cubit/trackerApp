// File: backend/index.js
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import enhancedSecurityRoutes from "./routes/enhancedSecurityRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import SecurityEvent from "./models/SecurityEvent.js";
import DeviceCommand from "./models/DeviceCommand.js";
import GpsTracker from "./models/GpsTracker.js";

dotenv.config();

// Connect to database (graceful failure)
const dbConnected = await connectDB();

const app = express();
const server = http.createServer(app);

// Security and middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const corsOptions = { origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "PATCH"] };
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const io = new Server(server, { cors: corsOptions });
app.set("io", io);

// Store device connections
io.deviceConnections = new Map();
io.userConnections = new Map();

// Enhanced WebSocket authentication with device support
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const deviceId = socket.handshake.auth?.deviceId;
    const type = socket.handshake.auth?.type; // 'web' or 'mobile'
    
    console.log('🔐 Socket authentication attempt:', {
        hasToken: !!token,
        hasDeviceId: !!deviceId,
        type: type,
        socketId: socket.id
    });
    
    if (!token) {
        console.error('❌ Authentication failed: No token provided');
        return next(new Error("Authentication error"));
    }
    
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = payload;
        socket.userId = payload.id;
        socket.deviceId = deviceId;
        socket.clientType = type;
        
        console.log('✅ JWT verified for user:', payload.id, 'type:', type);
        
        // Join user room
        socket.join(socket.userId);
        
        // If this is a mobile device, join device room
        if (type === 'mobile' && deviceId) {
            socket.join(`device_${deviceId}`);
            io.deviceConnections.set(deviceId, socket.id);
            console.log('📱 Mobile device connected - Device ID:', deviceId, 'Socket ID:', socket.id);
            
            // Also try to find the device in database and store with MongoDB ObjectId
            try {
                const deviceRecord = await GpsTracker.findOne({ deviceId: deviceId });
                if (deviceRecord) {
                    const mongoDeviceId = deviceRecord._id.toString();
                    socket.join(`device_${mongoDeviceId}`);
                    io.deviceConnections.set(mongoDeviceId, socket.id);
                    console.log('📱 Also registered with MongoDB ID:', mongoDeviceId);
                }
            } catch (error) {
                console.error('Error finding device record:', error);
            }
        }
        
        // Track user connections
        io.userConnections.set(socket.userId, socket.id);
        
        return next();
    } catch (err) {
        console.error('❌ JWT verification failed:', err.message);
        return next(new Error("Authentication error"));
    }
});

io.on("connection", (socket) => {
    console.log(`🔗 ${socket.clientType || 'unknown'} client connected:`, {
        userId: socket.userId,
        deviceId: socket.deviceId,
        socketId: socket.id,
        type: socket.clientType
    });
    
    // Send authentication confirmation
    socket.emit('authenticated', { 
        userId: socket.userId, 
        deviceId: socket.deviceId,
        type: socket.clientType,
        socketId: socket.id,
        timestamp: Date.now()
    });

    console.log('📊 Current connections:', {
        devices: io.deviceConnections.size,
        users: io.userConnections.size,
        deviceIds: Array.from(io.deviceConnections.keys())
    });

    // Handle device status updates
    socket.on('device-status-update', async (data) => {
        try {
            if (socket.clientType === 'mobile' && socket.deviceId) {
                // Update device status in database
                await GpsTracker.findByIdAndUpdate(socket.deviceId, {
                    'deviceStatus.isOnline': true,
                    'deviceStatus.lastSeen': new Date(),
                    'deviceStatus.batteryLevel': data.batteryLevel,
                    'deviceStatus.storageInfo': data.storageInfo,
                    'deviceStatus.appVersion': data.appVersion,
                    'deviceStatus.osVersion': data.osVersion
                });

                // Broadcast to user's web dashboard
                socket.to(socket.userId).emit('device-status-updated', {
                    deviceId: socket.deviceId,
                    status: data,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Error updating device status:', error);
        }
    });

    // Handle location updates from mobile devices
    socket.on('location-update', async (locationData) => {
        try {
            if (socket.clientType === 'mobile' && socket.deviceId) {
                // Broadcast to user's dashboard
                socket.to(socket.userId).emit('live-location-update', {
                    deviceId: socket.deviceId,
                    location: locationData,
                    timestamp: Date.now()
                });

                // Store in database if needed
                // Implementation depends on your location storage strategy
            }
        } catch (error) {
            console.error('Error handling location update:', error);
        }
    });

    // Handle security events from mobile devices
    socket.on('security-event', async (eventData) => {
        try {
            if (socket.clientType === 'mobile' && socket.deviceId) {
                // Create security event record
                const securityEvent = new SecurityEvent({
                    deviceId: socket.deviceId,
                    eventType: eventData.type,
                    severity: eventData.severity || 'medium',
                    description: eventData.description,
                    metadata: eventData.metadata || {},
                    location: eventData.location
                });

                await securityEvent.save();

                // Send alert to user's dashboard
                socket.to(socket.userId).emit('security-alert', {
                    event: securityEvent,
                    deviceId: socket.deviceId,
                    timestamp: Date.now()
                });

                // Send email notification for critical events
                if (eventData.severity === 'critical') {
                    // Implement email notification logic
                    console.log('Critical security event - sending email notification');
                }
            }
        } catch (error) {
            console.error('Error handling security event:', error);
        }
    });

    // Handle command acknowledgments from mobile devices
    socket.on('command-ack', async (data) => {
        try {
            const { commandId, status, response, error } = data;
            
            await DeviceCommand.findByIdAndUpdate(commandId, {
                status: status,
                acknowledgedAt: new Date(),
                response: response,
                error: error
            });

            // Notify dashboard of command status
            socket.to(socket.userId).emit('command-status-update', {
                commandId,
                status,
                response,
                error,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Error handling command acknowledgment:', error);
        }
    });

    // Handle media capture notifications
    socket.on('media-captured', async (mediaData) => {
        try {
            if (socket.clientType === 'mobile' && socket.deviceId) {
                // Notify dashboard of new media
                socket.to(socket.userId).emit('media-notification', {
                    deviceId: socket.deviceId,
                    media: mediaData,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Error handling media capture notification:', error);
        }
    });

    // Handle remote media capture commands from dashboard
    socket.on('remote-capture-command', async (commandData) => {
        try {
            if (socket.clientType === 'web') {
                const { deviceId, commandType, options = {} } = commandData;
                
                console.log('🎯 Remote command received:', {
                    deviceId,
                    commandType,
                    requestingUser: socket.userId
                });
                
                // Verify user owns this device
                const device = await GpsTracker.findOne({ 
                    _id: deviceId, 
                    userId: socket.userId 
                });
                
                if (!device) {
                    console.log('❌ Device not found in database for user:', socket.userId);
                    socket.emit('command-error', {
                        error: 'Device not found or access denied',
                        commandType
                    });
                    return;
                }

                console.log('✅ Device found in database:', {
                    deviceId: device._id,
                    deviceCode: device.deviceId,
                    deviceName: device.deviceName,
                    userId: device.userId
                });

                // Map command types to match schema enum values
                const commandTypeMap = {
                    'capture-photo': 'capture_photo',
                    'start-video': 'capture_video',
                    'stop-video': 'stop_video'
                };

                const mappedCommandType = commandTypeMap[commandType] || commandType;

                // Create command record
                const command = new DeviceCommand({
                    deviceId,
                    createdBy: socket.userId, // Add required createdBy field
                    commandType: mappedCommandType,
                    parameters: options,
                    status: 'pending'
                });
                
                await command.save();

                // Check if device is connected - IMPORTANT: Use the correct device identifier
                console.log('🔍 Checking device connection for database ID:', deviceId);
                console.log('🔍 Checking device connection for device code:', device.deviceId);
                console.log('📊 All available device connections:', Array.from(io.deviceConnections.entries()));
                
                // Try both database ID and device code
                let deviceSocketId = io.deviceConnections.get(deviceId.toString());
                if (!deviceSocketId) {
                    deviceSocketId = io.deviceConnections.get(device.deviceId);
                    console.log('🔄 Trying device code instead:', device.deviceId);
                }
                
                if (!deviceSocketId) {
                    console.log('❌ Device not found in any connection format');
                    command.status = 'failed';
                    command.error = 'Device is offline';
                    await command.save();
                    
                    socket.emit('command-error', {
                        error: 'Device is currently offline',
                        commandType,
                        commandId: command._id
                    });
                    return;
                }

                console.log('✅ Device found in connections:', deviceSocketId);

                // Send command to device (use original command type for mobile app)
                // Try both room formats
                const roomName1 = `device_${deviceId}`;
                const roomName2 = `device_${device.deviceId}`;
                
                console.log('📡 Sending command to rooms:', roomName1, 'and', roomName2);
                
                const commandPayload = {
                    commandId: command._id,
                    type: commandType, // Send original command type to mobile
                    data: options,
                    timestamp: Date.now()
                };
                
                io.to(roomName1).emit('device-command', commandPayload);
                io.to(roomName2).emit('device-command', commandPayload);

                // Update command status
                command.status = 'sent';
                command.sentAt = new Date();
                await command.save();

                // Confirm command sent
                socket.emit('command-sent', {
                    commandId: command._id,
                    commandType,
                    deviceId,
                    timestamp: Date.now()
                });

                console.log(`✅ Remote capture command sent: ${commandType} to device ${deviceId}`);
            }
        } catch (error) {
            console.error('Error handling remote capture command:', error);
            socket.emit('command-error', {
                error: 'Failed to process command',
                commandType: commandData.commandType
            });
        }
    });

    // Handle SOS alerts
    socket.on('sos-alert', async (alertData) => {
        try {
            if (socket.clientType === 'mobile' && socket.deviceId) {
                // Create critical security event
                const securityEvent = new SecurityEvent({
                    deviceId: socket.deviceId,
                    eventType: 'sos_alert',
                    severity: 'critical',
                    description: 'SOS Alert activated by user',
                    metadata: alertData,
                    location: alertData.location
                });

                await securityEvent.save();

                // Send immediate alert to dashboard
                socket.to(socket.userId).emit('sos-alert-received', {
                    event: securityEvent,
                    deviceId: socket.deviceId,
                    location: alertData.location,
                    timestamp: Date.now()
                });

                // Send emergency notifications
                console.log('SOS Alert received - triggering emergency protocols');
            }
        } catch (error) {
            console.error('Error handling SOS alert:', error);
        }
    });

    // Handle tracker subscription (for web dashboard)
    socket.on("subscribeTracker", (trackerId) => {
        socket.join(`tracker_${trackerId}`);
        console.log(`User ${socket.userId} subscribed to tracker ${trackerId}`);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`${socket.clientType || 'unknown'} client disconnected - User: ${socket.userId}`);
        
        // Clean up connections
        if (socket.deviceId) {
            io.deviceConnections.delete(socket.deviceId);
            
            // Also clean up MongoDB ID connection if it exists
            GpsTracker.findOne({ deviceId: socket.deviceId })
                .then(deviceRecord => {
                    if (deviceRecord) {
                        const mongoDeviceId = deviceRecord._id.toString();
                        io.deviceConnections.delete(mongoDeviceId);
                        console.log('🧹 Cleaned up MongoDB device connection:', mongoDeviceId);
                    }
                })
                .catch(console.error);
            
            // Update device offline status
            GpsTracker.findByIdAndUpdate(socket.deviceId, {
                'deviceStatus.isOnline': false,
                'deviceStatus.lastSeen': new Date()
            }).catch(console.error);
        }
        
        io.userConnections.delete(socket.userId);
        
        console.log('📊 Connections after disconnect:', {
            devices: io.deviceConnections.size,
            users: io.userConnections.size
        });
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/security/enhanced", enhancedSecurityRoutes);
app.use("/api/media", mediaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connections: {
            devices: io.deviceConnections.size,
            users: io.userConnections.size
        }
    });
});

// Export IO instance for use in routes
export const getIO = () => io;

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 TrackerApp Backend Server listening on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`� Database: ${dbConnected ? 'Connected' : 'Disconnected (see warning above)'}`);
    console.log(`�🔗 WebSocket server ready for connections`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 API documentation: http://localhost:${PORT}/api-docs`);
});
