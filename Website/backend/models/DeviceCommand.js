import mongoose from 'mongoose';

const deviceCommandSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GpsTracker',
    required: true
  },
  commandType: {
    type: String,
    required: true,
    enum: [
      'remote_lock',
      'remote_unlock',
      'remote_alarm',
      'stop_alarm',
      'capture_photo',
      'capture_video',
      'stop_video',
      'factory_reset',
      'get_status',
      'update_config',
      'enable_movement_lock',
      'disable_movement_lock',
      'enable_dont_touch',
      'disable_dont_touch',
      'enable_app_lock',
      'disable_app_lock',
      'enable_usb_lock',
      'disable_usb_lock',
      'enable_screen_lock',
      'disable_screen_lock',
      'clear_cache',
      'optimize_performance',
      'prevent_uninstall',
      'allow_uninstall'
    ]
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'acknowledged', 'completed', 'failed', 'timeout'],
    default: 'pending'
  },
  sentAt: Date,
  acknowledgedAt: Date,
  completedAt: Date,
  response: {
    type: mongoose.Schema.Types.Mixed
  },
  error: String,
  timeout: {
    type: Number,
    default: 60000 // 60 seconds default timeout
  },
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
deviceCommandSchema.index({ deviceId: 1, status: 1 });
deviceCommandSchema.index({ commandType: 1 });
deviceCommandSchema.index({ createdAt: -1 });

export default mongoose.model('DeviceCommand', deviceCommandSchema);
