import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import GpsTracker from '../models/GpsTracker.js';
import SecurityEvent from '../models/SecurityEvent.js';
import DeviceCommand from '../models/DeviceCommand.js';
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

export default router;
