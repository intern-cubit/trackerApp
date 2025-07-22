import express from 'express';
import asyncHandler from 'express-async-handler';
import SecurityEvent from '../models/SecurityEvent.js';
import DeviceCommand from '../models/DeviceCommand.js';
import GpsTracker from '../models/GpsTracker.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { getIO } from '../index.js';

const router = express.Router();

// Get security events for a device
router.get('/events/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { page = 1, limit = 50, eventType, severity, startDate, endDate } = req.query;

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user.id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  const query = { deviceId };

  // Apply filters
  if (eventType) query.eventType = eventType;
  if (severity) query.severity = severity;
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const events = await SecurityEvent.find(query)
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const totalEvents = await SecurityEvent.countDocuments(query);

  res.json({
    events,
    totalPages: Math.ceil(totalEvents / limit),
    currentPage: page,
    totalEvents
  });
}));

// Get security event by ID
router.get('/events/detail/:eventId', authMiddleware, asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await SecurityEvent.findById(eventId)
    .populate('deviceId', 'deviceName')
    .lean();

  if (!event) {
    return res.status(404).json({ message: 'Security event not found' });
  }

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: event.deviceId._id, userId: req.user.id });
  if (!device) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(event);
}));

// Mark security event as resolved
router.patch('/events/:eventId/resolve', authMiddleware, asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await SecurityEvent.findById(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Security event not found' });
  }

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: event.deviceId, userId: req.user.id });
  if (!device) {
    return res.status(403).json({ message: 'Access denied' });
  }

  event.isResolved = true;
  event.resolvedAt = new Date();
  event.resolvedBy = 'user';
  await event.save();

  res.json({ message: 'Security event marked as resolved', event });
}));

// Send remote command to device
router.post('/commands', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId, commandType, parameters } = req.body;
  console.log(`Received command: ${commandType}`, parameters, deviceId);
  console.log(`User ID: ${req.user.id}`);

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user.id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  // Create command record
  const command = new DeviceCommand({
    deviceId,
    commandType,
    parameters: parameters || {},
    createdBy: req.user.id
  });

  await command.save();

  // Send command via WebSocket
  const io = getIO();
  const deviceSocketId = io.deviceConnections.get(deviceId.toString());
  
  if (deviceSocketId) {
    io.to(deviceSocketId).emit('device-command', {
      commandId: command._id,
      type: commandType,
      data: parameters || {}
    });

    command.status = 'sent';
    command.sentAt = new Date();
    await command.save();
  } else {
    command.status = 'failed';
    command.error = 'Device not connected';
    await command.save();
  }

  res.json({ 
    message: 'Command sent successfully', 
    commandId: command._id,
    status: command.status
  });
}));

// Get command status
router.get('/commands/:commandId', authMiddleware, asyncHandler(async (req, res) => {
  const { commandId } = req.params;

  const command = await DeviceCommand.findById(commandId)
    .populate('deviceId', 'deviceName')
    .lean();

  if (!command) {
    return res.status(404).json({ message: 'Command not found' });
  }

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: command.deviceId._id, userId: req.user.id });
  if (!device) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(command);
}));

// Get command history for a device
router.get('/commands/device/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { page = 1, limit = 20, status, commandType } = req.query;

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user.id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  const query = { deviceId };
  if (status) query.status = status;
  if (commandType) query.commandType = commandType;

  const commands = await DeviceCommand.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('createdBy', 'email')
    .lean();

  const totalCommands = await DeviceCommand.countDocuments(query);

  res.json({
    commands,
    totalPages: Math.ceil(totalCommands / limit),
    currentPage: page,
    totalCommands
  });
}));

// Update device security settings
router.patch('/settings/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { securitySettings, performanceSettings, mediaCaptureSettings } = req.body;

  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user.id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  // Update settings
  if (securitySettings) {
    device.securitySettings = { ...device.securitySettings.toObject(), ...securitySettings };
  }
  if (performanceSettings) {
    device.performanceSettings = { ...device.performanceSettings.toObject(), ...performanceSettings };
  }
  if (mediaCaptureSettings) {
    device.mediaCaptureSettings = { ...device.mediaCaptureSettings.toObject(), ...mediaCaptureSettings };
  }

  await device.save();

  // Send configuration update to device
  const io = getIO();
  const deviceSocketId = io.deviceConnections.get(deviceId.toString());
  
  if (deviceSocketId) {
    io.to(deviceSocketId).emit('configuration-update', {
      securitySettings: device.securitySettings,
      performanceSettings: device.performanceSettings,
      mediaCaptureSettings: device.mediaCaptureSettings
    });
  }

  res.json({ 
    message: 'Settings updated successfully', 
    device: {
      securitySettings: device.securitySettings,
      performanceSettings: device.performanceSettings,
      mediaCaptureSettings: device.mediaCaptureSettings
    }
  });
}));

// Get device security analytics
router.get('/analytics/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { period = '7d' } = req.query;

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user.id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Get event statistics
  const eventStats = await SecurityEvent.aggregate([
    {
      $match: {
        deviceId: device._id,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        latestEvent: { $max: '$timestamp' }
      }
    }
  ]);

  // Get severity distribution
  const severityStats = await SecurityEvent.aggregate([
    {
      $match: {
        deviceId: device._id,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get daily event counts
  const dailyStats = await SecurityEvent.aggregate([
    {
      $match: {
        deviceId: device._id,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  res.json({
    period: period,
    eventStats,
    severityStats,
    dailyStats,
    deviceStatus: device.deviceStatus
  });
}));

// Emergency actions
router.post('/emergency/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { action, reason } = req.body;

  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user.id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  const validActions = ['emergency_lock', 'emergency_alarm', 'emergency_wipe', 'emergency_locate'];
  
  if (!validActions.includes(action)) {
    return res.status(400).json({ message: 'Invalid emergency action' });
  }

  // Create emergency command
  const command = new DeviceCommand({
    deviceId,
    commandType: action,
    parameters: { reason, isEmergency: true },
    createdBy: req.user.id,
    timeout: 10000 // 10 seconds for emergency commands
  });

  await command.save();

  // Log security event
  const securityEvent = new SecurityEvent({
    deviceId,
    eventType: action.replace('emergency_', ''),
    severity: 'critical',
    description: `Emergency ${action} triggered: ${reason}`,
    metadata: { reason, triggeredBy: req.user.email }
  });

  await securityEvent.save();

  // Send emergency command
  const io = getIO();
  const deviceSocketId = io.deviceConnections.get(deviceId.toString());
  
  if (deviceSocketId) {
    io.to(deviceSocketId).emit('emergency-command', {
      commandId: command._id,
      action,
      reason,
      timestamp: Date.now()
    });

    command.status = 'sent';
    command.sentAt = new Date();
  } else {
    command.status = 'failed';
    command.error = 'Device not connected';
  }

  await command.save();

  res.json({ 
    message: `Emergency ${action} initiated`,
    commandId: command._id,
    eventId: securityEvent._id
  });
}));

export default router;
