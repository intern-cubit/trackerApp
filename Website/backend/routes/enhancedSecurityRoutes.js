import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import GpsTracker from '../models/GpsTracker.js';
import SecurityEvent from '../models/SecurityEvent.js';
import DeviceCommand from '../models/DeviceCommand.js';
import { sendSecurityAlert } from '../utils/emailService.js';
import { getIO } from '../index.js';

const router = express.Router();

// Get comprehensive device security analytics
router.get('/analytics/comprehensive/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { period = '7d' } = req.query;

    // Verify device ownership
    const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const periodDays = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Get security events breakdown
    const securityEvents = await SecurityEvent.aggregate([
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
          latestEvent: { $max: '$timestamp' },
          severity: { $first: '$severity' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get command statistics
    const commandStats = await DeviceCommand.aggregate([
      {
        $match: {
          deviceId: device._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get daily activity
    const dailyActivity = await SecurityEvent.aggregate([
      {
        $match: {
          deviceId: device._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          events: { $sum: 1 },
          criticalEvents: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Feature usage statistics
    const featureUsage = {
      movementLock: device.securitySettings.movementLockEnabled,
      dontTouchLock: device.securitySettings.dontTouchLockEnabled,
      usbLock: device.securitySettings.usbLockEnabled,
      appLock: device.securitySettings.appLockEnabled,
      sosEnabled: device.securitySettings.sosEnabled,
      preventUninstall: device.securitySettings.preventUninstall
    };

    res.json({
      device: {
        id: device._id,
        name: device.device?.deviceName || 'Unknown Device',
        status: device.deviceStatus
      },
      period: period,
      securityEvents,
      commandStats,
      dailyActivity,
      featureUsage,
      summary: {
        totalEvents: securityEvents.reduce((sum, event) => sum + event.count, 0),
        criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
        lastActivity: securityEvents.length > 0 ? Math.max(...securityEvents.map(e => e.latestEvent)) : null
      }
    });

  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Bulk security command execution
router.post('/commands/bulk', authMiddleware, async (req, res) => {
  try {
    const { deviceIds, commandType, parameters } = req.body;

    if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
      return res.status(400).json({ message: 'Device IDs array is required' });
    }

    // Verify all devices belong to user
    const devices = await GpsTracker.find({ 
      _id: { $in: deviceIds }, 
      userId: req.user._id 
    });

    if (devices.length !== deviceIds.length) {
      return res.status(403).json({ message: 'Some devices not found or access denied' });
    }

    const commands = [];
    const io = getIO();

    for (const device of devices) {
      // Create command record
      const command = new DeviceCommand({
        deviceId: device._id,
        commandType,
        parameters: parameters || {},
        createdBy: req.user._id
      });

      await command.save();
      commands.push(command);

      // Send command via WebSocket
      const deviceSocketId = io.deviceConnections.get(device._id.toString());
      
      if (deviceSocketId) {
        io.to(deviceSocketId).emit('device-command', {
          commandId: command._id,
          type: commandType,
          data: parameters || {}
        });

        command.status = 'sent';
        command.sentAt = new Date();
        await command.save();
      }
    }

    res.json({ 
      message: `Bulk command sent to ${commands.length} devices`,
      commands: commands.map(cmd => ({
        commandId: cmd._id,
        deviceId: cmd.deviceId,
        status: cmd.status
      }))
    });

  } catch (error) {
    console.error('Error executing bulk commands:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Security feature recommendations
router.get('/recommendations/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    // Analyze recent security events
    const recentEvents = await SecurityEvent.find({
      deviceId: device._id,
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ timestamp: -1 });

    const recommendations = [];

    // Check for repeated failed login attempts
    const failedLogins = recentEvents.filter(e => e.eventType === 'failed_login');
    if (failedLogins.length > 5 && !device.securitySettings.movementLockEnabled) {
      recommendations.push({
        type: 'security_enhancement',
        priority: 'high',
        title: 'Enable Movement Lock',
        description: 'Multiple failed login attempts detected. Consider enabling movement lock for additional security.',
        action: 'enable_movement_lock',
        category: 'protection'
      });
    }

    // Check for movement detection without don't touch lock
    const movementEvents = recentEvents.filter(e => e.eventType === 'movement_detected');
    if (movementEvents.length > 3 && !device.securitySettings.dontTouchLockEnabled) {
      recommendations.push({
        type: 'security_enhancement',
        priority: 'medium',
        title: 'Enable Don\'t Touch Lock',
        description: 'Device movement detected frequently. Enable don\'t touch lock for public charging scenarios.',
        action: 'enable_dont_touch',
        category: 'protection'
      });
    }

    // Check if USB lock is disabled
    if (!device.securitySettings.usbLockEnabled) {
      recommendations.push({
        type: 'security_enhancement',
        priority: 'medium',
        title: 'Enable USB Lock',
        description: 'Protect against unauthorized data access via USB connections.',
        action: 'enable_usb_lock',
        category: 'data_protection'
      });
    }

    // Performance recommendations
    if (!device.performanceSettings?.autoClearCache) {
      recommendations.push({
        type: 'performance_optimization',
        priority: 'low',
        title: 'Enable Auto Cache Clear',
        description: 'Automatically clear cache to maintain optimal performance.',
        action: 'enable_auto_cache_clear',
        category: 'performance'
      });
    }

    // Check for no recent activity (potential device issues)
    if (recentEvents.length === 0) {
      recommendations.push({
        type: 'device_health',
        priority: 'medium',
        title: 'Check Device Connectivity',
        description: 'No recent security events detected. Verify device is online and functioning.',
        action: 'check_connectivity',
        category: 'maintenance'
      });
    }

    res.json({
      deviceId,
      recommendations,
      analysisDate: new Date(),
      eventsAnalyzed: recentEvents.length
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Security health score
router.get('/health-score/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user._id });
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const settings = device.securitySettings;
    let score = 0;
    const maxScore = 100;
    const factors = [];

    // Basic security features (40 points)
    if (settings.autoLockEnabled) {
      score += 10;
      factors.push({ feature: 'Auto Lock', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'Auto Lock', points: 10, enabled: false });
    }

    if (settings.sosEnabled) {
      score += 10;
      factors.push({ feature: 'SOS Alert', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'SOS Alert', points: 10, enabled: false });
    }

    if (settings.preventUninstall) {
      score += 10;
      factors.push({ feature: 'Prevent Uninstall', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'Prevent Uninstall', points: 10, enabled: false });
    }

    if (settings.maxFailedAttempts <= 3) {
      score += 10;
      factors.push({ feature: 'Failed Attempts Limit', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'Failed Attempts Limit', points: 10, enabled: false });
    }

    // Advanced security features (40 points)
    if (settings.movementLockEnabled) {
      score += 10;
      factors.push({ feature: 'Movement Lock', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'Movement Lock', points: 10, enabled: false });
    }

    if (settings.dontTouchLockEnabled) {
      score += 10;
      factors.push({ feature: 'Don\'t Touch Lock', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'Don\'t Touch Lock', points: 10, enabled: false });
    }

    if (settings.usbLockEnabled) {
      score += 10;
      factors.push({ feature: 'USB Lock', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'USB Lock', points: 10, enabled: false });
    }

    if (settings.appLockEnabled) {
      score += 10;
      factors.push({ feature: 'App Lock', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'App Lock', points: 10, enabled: false });
    }

    // Device health (20 points)
    const isOnline = device.deviceStatus?.isOnline;
    if (isOnline) {
      score += 10;
      factors.push({ feature: 'Device Online', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'Device Online', points: 10, enabled: false });
    }

    const lastSeen = device.deviceStatus?.lastSeen;
    const daysSinceLastSeen = lastSeen ? (Date.now() - new Date(lastSeen)) / (1000 * 60 * 60 * 24) : 999;
    if (daysSinceLastSeen < 1) {
      score += 10;
      factors.push({ feature: 'Recent Activity', points: 10, enabled: true });
    } else {
      factors.push({ feature: 'Recent Activity', points: 10, enabled: false });
    }

    // Determine security level
    let securityLevel = 'Poor';
    let color = '#ef4444'; // red
    if (score >= 80) {
      securityLevel = 'Excellent';
      color = '#22c55e'; // green
    } else if (score >= 60) {
      securityLevel = 'Good';
      color = '#3b82f6'; // blue
    } else if (score >= 40) {
      securityLevel = 'Fair';
      color = '#f59e0b'; // yellow
    }

    res.json({
      deviceId,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      securityLevel,
      color,
      factors,
      lastCalculated: new Date()
    });

  } catch (error) {
    console.error('Error calculating health score:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// =================== ENHANCED SECURITY ROUTES ===================

// Log security event
router.post('/event', async (req, res) => {
  try {
    const { 
      deviceId, 
      type, 
      severity = 'medium',
      details = {},
      location,
      timestamp 
    } = req.body;

    // Find device by deviceId string
    const device = await GpsTracker.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Create security event
    const securityEvent = new SecurityEvent({
      deviceId: device._id,
      eventType: type,
      severity,
      details,
      location,
      timestamp: timestamp || Date.now(),
      resolved: false
    });

    await securityEvent.save();

    // Update device security status
    if (!device.securityStats) {
      device.securityStats = {
        totalEvents: 0,
        failedAttempts: 0,
        movementDetections: 0,
        usbAttempts: 0,
        lastEventTime: null
      };
    }
    
    device.securityStats.totalEvents++;
    device.securityStats.lastEventTime = securityEvent.timestamp;
    
    // Increment specific counters
    switch (type) {
      case 'failed_attempt':
        device.securityStats.failedAttempts++;
        break;
      case 'movement_detected':
        device.securityStats.movementDetections++;
        break;
      case 'usb_access_attempt':
        device.securityStats.usbAttempts++;
        break;
    }
    
    await device.save();

    console.log(`📝 Security event logged: ${type} for device ${deviceId}`);

    res.json({
      success: true,
      eventId: securityEvent._id,
      message: 'Security event logged successfully'
    });

  } catch (error) {
    console.error('Error logging security event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log security event'
    });
  }
});

// Send security alert (triggers email notification)
router.post('/alert', async (req, res) => {
  try {
    const {
      deviceId,
      type,
      critical = false,
      priority = 'medium',
      location,
      timestamp,
      details = {}
    } = req.body;

    console.log(`🚨 Security alert received: ${type} for device ${deviceId}`);

    // Find device and user
    const device = await GpsTracker.findOne({ deviceId }).populate('userId');
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Create security event
    const securityEvent = new SecurityEvent({
      deviceId: device._id,
      eventType: type,
      severity: critical ? 'critical' : priority,
      details: {
        ...details,
        alertSent: true,
        emailNotification: true
      },
      location,
      timestamp: timestamp || Date.now(),
      resolved: false
    });

    await securityEvent.save();

    // Prepare alert email
    const alertData = {
      deviceId,
      deviceName: device.name || `Device ${deviceId}`,
      userEmail: device.userId.email,
      userName: device.userId.name || device.userId.email,
      alertType: type,
      severity: critical ? 'CRITICAL' : priority.toUpperCase(),
      timestamp: new Date(timestamp || Date.now()).toLocaleString(),
      location: location ? `${location.latitude}, ${location.longitude}` : 'Unknown',
      details
    };

    // Send email notification
    try {
      await sendSecurityAlert(alertData);
      console.log(`📧 Security alert email sent for ${type}`);
    } catch (emailError) {
      console.error('Failed to send security alert email:', emailError);
    }

    // Update device alert status
    device.lastAlert = {
      type,
      timestamp: Date.now(),
      severity: critical ? 'critical' : priority,
      emailSent: true
    };
    await device.save();

    res.json({
      success: true,
      eventId: securityEvent._id,
      emailSent: true,
      message: 'Security alert processed successfully'
    });

  } catch (error) {
    console.error('Error processing security alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process security alert'
    });
  }
});

// Send critical security alert (for SOS and emergency situations)
router.post('/critical-alert', authMiddleware, async (req, res) => {
  try {
    const {
      type,
      method,
      timestamp,
      location,
      deviceInfo,
      emergency = true,
      priority = 'CRITICAL'
    } = req.body;

    console.log(`🆘 CRITICAL SECURITY ALERT: ${type} via ${method}`);

    // Find user's device
    const device = await GpsTracker.findOne({ userId: req.user._id }).populate('userId');
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Create critical security event
    const securityEvent = new SecurityEvent({
      deviceId: device._id,
      eventType: type,
      severity: 'critical',
      details: {
        method,
        deviceInfo,
        emergency: true,
        priority: 'CRITICAL',
        alertSent: true,
        emailNotification: true,
        responseTimes: {
          received: Date.now(),
          processed: Date.now()
        }
      },
      location,
      timestamp: timestamp || Date.now(),
      resolved: false
    });

    await securityEvent.save();

    // Prepare critical alert email with emergency formatting
    const alertData = {
      deviceId: device.deviceId,
      deviceName: device.name || `Device ${device.deviceId}`,
      userEmail: device.userId.email,
      userName: device.userId.name || device.userId.email,
      alertType: type,
      severity: 'CRITICAL EMERGENCY',
      timestamp: new Date(timestamp || Date.now()).toLocaleString(),
      location: location ? `${location.latitude}, ${location.longitude}` : 'Unknown',
      details: {
        method,
        deviceInfo,
        emergency: true,
        message: `EMERGENCY: ${type} activated via ${method}. Immediate attention required.`
      }
    };

    // Send emergency email notification
    try {
      await sendSecurityAlert(alertData);
      console.log(`🚨 CRITICAL security alert email sent for ${type}`);
    } catch (emailError) {
      console.error('Failed to send critical security alert email:', emailError);
    }

    // Update device with critical alert status
    device.lastAlert = {
      type,
      timestamp: Date.now(),
      severity: 'critical',
      emergency: true,
      method,
      emailSent: true
    };
    
    // Mark device as in emergency state
    if (!device.securityStatus) {
      device.securityStatus = {};
    }
    
    device.securityStatus = {
      ...device.securityStatus,
      emergencyMode: true,
      emergencyType: type,
      emergencyTimestamp: Date.now(),
      lastEmergencyLocation: location
    };

    await device.save();

    // Emit real-time alert to dashboard
    const io = getIO();
    if (io) {
      io.emit('critical-security-alert', {
        deviceId: device.deviceId,
        type,
        method,
        timestamp: timestamp || Date.now(),
        location,
        emergency: true,
        severity: 'CRITICAL'
      });
    }

    res.json({
      success: true,
      eventId: securityEvent._id,
      emailSent: true,
      emergencyMode: true,
      message: 'Critical security alert processed - emergency protocols activated'
    });

  } catch (error) {
    console.error('Error processing critical security alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process critical security alert'
    });
  }
});

// Remote device lock
router.post('/lock/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { reason = 'manual', duration } = req.body;

    const device = await GpsTracker.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Update device lock status
    if (!device.securityStatus) {
      device.securityStatus = {};
    }
    
    device.securityStatus = {
      ...device.securityStatus,
      isLocked: true,
      lockReason: reason,
      lockTimestamp: Date.now(),
      lockDuration: duration,
      lockedBy: req.user._id
    };

    await device.save();

    // Create security event
    const securityEvent = new SecurityEvent({
      deviceId: device._id,
      eventType: 'remote_lock',
      severity: 'high',
      details: {
        reason,
        duration,
        adminId: req.user._id,
        source: 'dashboard'
      },
      timestamp: Date.now(),
      resolved: false
    });

    await securityEvent.save();

    // Emit socket event to device
    const io = getIO();
    if (io) {
      io.to(deviceId).emit('remote-lock', {
        reason,
        duration,
        timestamp: Date.now(),
        adminId: req.user._id
      });
    }

    console.log(`🔒 Device ${deviceId} locked remotely by admin ${req.user._id}`);

    res.json({
      success: true,
      message: 'Device locked successfully',
      lockStatus: device.securityStatus
    });

  } catch (error) {
    console.error('Error locking device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lock device'
    });
  }
});

// Remote device unlock
router.post('/unlock/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { reason = 'manual' } = req.body;

    const device = await GpsTracker.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Update device lock status
    if (!device.securityStatus) {
      device.securityStatus = {};
    }
    
    device.securityStatus = {
      ...device.securityStatus,
      isLocked: false,
      unlockReason: reason,
      unlockTimestamp: Date.now(),
      unlockedBy: req.user._id
    };

    await device.save();

    // Create security event
    const securityEvent = new SecurityEvent({
      deviceId: device._id,
      eventType: 'remote_unlock',
      severity: 'medium',
      details: {
        reason,
        adminId: req.user._id,
        source: 'dashboard'
      },
      timestamp: Date.now(),
      resolved: true
    });

    await securityEvent.save();

    // Emit socket event to device
    const io = getIO();
    if (io) {
      io.to(deviceId).emit('remote-unlock', {
        reason,
        timestamp: Date.now(),
        adminId: req.user._id
      });
    }

    console.log(`🔓 Device ${deviceId} unlocked remotely by admin ${req.user._id}`);

    res.json({
      success: true,
      message: 'Device unlocked successfully',
      lockStatus: device.securityStatus
    });

  } catch (error) {
    console.error('Error unlocking device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock device'
    });
  }
});

// Remote factory reset (CRITICAL)
router.post('/factory-reset/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { confirmation, reason = 'admin_request' } = req.body;

    // Require explicit confirmation
    if (confirmation !== 'CONFIRM_FACTORY_RESET') {
      return res.status(400).json({
        success: false,
        error: 'Factory reset requires explicit confirmation'
      });
    }

    const device = await GpsTracker.findOne({ deviceId }).populate('userId');
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Create critical security event
    const securityEvent = new SecurityEvent({
      deviceId: device._id,
      eventType: 'remote_factory_reset_initiated',
      severity: 'critical',
      details: {
        reason,
        adminId: req.user._id,
        confirmation,
        userEmail: device.userId.email,
        source: 'dashboard'
      },
      timestamp: Date.now(),
      resolved: false
    });

    await securityEvent.save();

    // Send critical alert email
    try {
      await sendSecurityAlert({
        deviceId,
        deviceName: device.name || `Device ${deviceId}`,
        userEmail: device.userId.email,
        userName: device.userId.name || device.userId.email,
        alertType: 'FACTORY_RESET_INITIATED',
        severity: 'CRITICAL',
        timestamp: new Date().toLocaleString(),
        details: {
          reason,
          adminId: req.user._id,
          warning: 'ALL DATA WILL BE ERASED - THIS CANNOT BE UNDONE'
        }
      });
    } catch (emailError) {
      console.error('Failed to send factory reset alert email:', emailError);
    }

    // Emit socket event to device
    const io = getIO();
    if (io) {
      io.to(deviceId).emit('remote-factory-reset', {
        reason,
        timestamp: Date.now(),
        adminId: req.user._id,
        confirmation: 'required'
      });
    }

    console.log(`🏭 FACTORY RESET initiated for device ${deviceId} by admin ${req.user._id}`);

    res.json({
      success: true,
      message: 'Factory reset command sent to device',
      warning: 'Device will require user confirmation to proceed',
      eventId: securityEvent._id
    });

  } catch (error) {
    console.error('Error initiating factory reset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate factory reset'
    });
  }
});

// Update device security settings remotely
router.post('/settings/:deviceId', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { settings } = req.body;

    const device = await GpsTracker.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found'
      });
    }

    // Update security settings
    device.securitySettings = {
      ...device.securitySettings,
      ...settings,
      lastUpdated: Date.now(),
      updatedBy: req.user._id
    };

    await device.save();

    // Emit socket event to device
    const io = getIO();
    if (io) {
      io.to(deviceId).emit('remote-settings-update', {
        settings,
        timestamp: Date.now(),
        source: 'dashboard'
      });
    }

    console.log(`⚙️ Security settings updated for device ${deviceId}`);

    res.json({
      success: true,
      message: 'Security settings updated successfully',
      settings: device.securitySettings
    });

  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update security settings'
    });
  }
});

export default router;
