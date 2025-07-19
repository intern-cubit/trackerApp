import mongoose from 'mongoose';

const mediaFileSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GpsTracker',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  fileType: {
    type: String,
    enum: ['photo', 'video'],
    required: true
  },
  mimeType: String,
  size: Number, // in bytes
  duration: Number, // for videos, in seconds
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  cloudinaryPublicId: String,
  isRemoteCaptured: {
    type: Boolean,
    default: false
  },
  captureReason: {
    type: String,
    enum: ['manual', 'sos_alert', 'failed_login', 'movement_detected', 'scheduled', 'remote_command'],
    default: 'manual'
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  deviceInfo: {
    batteryLevel: Number,
    timestamp: Date,
    metadata: mongoose.Schema.Types.Mixed
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  tags: [String],
  isSecurityRelated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
mediaFileSchema.index({ deviceId: 1, createdAt: -1 });
mediaFileSchema.index({ fileType: 1 });
mediaFileSchema.index({ isRemoteCaptured: 1 });
mediaFileSchema.index({ captureReason: 1 });
mediaFileSchema.index({ isSecurityRelated: 1 });

export default mongoose.model('MediaFile', mediaFileSchema);
