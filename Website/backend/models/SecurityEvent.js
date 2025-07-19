import mongoose from 'mongoose';

const securityEventSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GpsTracker',
    required: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'failed_login',
      'auto_lock',
      'sos_alert',
      'movement_detected',
      'dont_touch_triggered',
      'remote_lock',
      'remote_unlock',
      'alarm_triggered',
      'alarm_stopped',
      'photo_captured',
      'video_captured',
      'factory_reset',
      'app_lock_violation',
      'usb_connection_blocked',
      'cache_cleared',
      'performance_optimized',
      'uninstall_prevented',
      'screen_lock_enabled',
      'configuration_updated',
      'emergency_command_executed'
    ]
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  resolvedBy: {
    type: String,
    enum: ['user', 'admin', 'auto']
  },
  mediaFiles: [{
    type: String, // URLs to captured photos/videos
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
securityEventSchema.index({ deviceId: 1, timestamp: -1 });
securityEventSchema.index({ eventType: 1 });
securityEventSchema.index({ severity: 1 });
securityEventSchema.index({ isResolved: 1 });

export default mongoose.model('SecurityEvent', securityEventSchema);
