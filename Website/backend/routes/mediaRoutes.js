import express from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import MediaFile from '../models/MediaFile.js';
import GpsTracker from '../models/GpsTracker.js';
import SecurityEvent from '../models/SecurityEvent.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Upload media file
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { deviceId, type, isRemote, captureReason, location } = req.body;

  // Verify device exists (for mobile app uploads, we might not have user auth)
  const device = await GpsTracker.findById(deviceId);
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  try {
    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: type === 'video' ? 'video' : 'image',
          folder: `tracker-app/${deviceId}`,
          format: type === 'video' ? 'mp4' : 'jpg',
          transformation: type === 'image' ? [
            { width: 1920, height: 1080, crop: 'limit', quality: 'auto' }
          ] : [
            { width: 1280, height: 720, crop: 'limit', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Create thumbnail for videos
    let thumbnailUrl = null;
    if (type === 'video') {
      const thumbnailResult = await cloudinary.uploader.upload(uploadResult.secure_url, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 400, height: 300, crop: 'fill' },
          { start_offset: '1' } // Take thumbnail at 1 second
        ]
      });
      thumbnailUrl = thumbnailResult.secure_url;
    }

    // Save media file record
    const mediaFile = new MediaFile({
      deviceId,
      filename: uploadResult.public_id,
      originalName: req.file.originalname,
      fileType: type,
      mimeType: req.file.mimetype,
      size: req.file.size,
      duration: uploadResult.duration || null,
      url: uploadResult.secure_url,
      thumbnailUrl,
      cloudinaryPublicId: uploadResult.public_id,
      isRemoteCaptured: isRemote === 'true',
      captureReason: captureReason || 'manual',
      location: location ? JSON.parse(location) : null,
      isSecurityRelated: ['sos_alert', 'failed_login', 'movement_detected'].includes(captureReason),
      isProcessed: true,
      processingStatus: 'completed'
    });

    await mediaFile.save();

    // If this is a security-related capture, create a security event
    if (mediaFile.isSecurityRelated) {
      const securityEvent = new SecurityEvent({
        deviceId,
        eventType: `${type}_captured`,
        severity: captureReason === 'sos_alert' ? 'critical' : 'medium',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} captured due to ${captureReason}`,
        metadata: {
          mediaFileId: mediaFile._id,
          captureReason,
          fileSize: req.file.size,
          isRemote: isRemote === 'true'
        },
        location: mediaFile.location,
        mediaFiles: [uploadResult.secure_url]
      });

      await securityEvent.save();
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      mediaFile: {
        id: mediaFile._id,
        url: uploadResult.secure_url,
        thumbnailUrl,
        type,
        size: req.file.size,
        timestamp: mediaFile.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
}));

// Get media files for a device
router.get('/device/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { 
    page = 1, 
    limit = 20, 
    type, 
    isRemote, 
    captureReason, 
    startDate, 
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user._id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  const query = { deviceId };

  // Apply filters
  if (type) query.fileType = type;
  if (isRemote !== undefined) query.isRemoteCaptured = isRemote === 'true';
  if (captureReason) query.captureReason = captureReason;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const mediaFiles = await MediaFile.find(query)
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const totalFiles = await MediaFile.countDocuments(query);

  res.json({
    mediaFiles,
    totalPages: Math.ceil(totalFiles / limit),
    currentPage: page,
    totalFiles,
    deviceName: device.deviceName
  });
}));

// Get media file by ID
router.get('/:fileId', authMiddleware, asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const mediaFile = await MediaFile.findById(fileId)
    .populate('deviceId', 'deviceName')
    .lean();

  if (!mediaFile) {
    return res.status(404).json({ message: 'Media file not found' });
  }

  // Verify device ownership
  const device = await GpsTracker.findOne({ 
    _id: mediaFile.deviceId._id, 
    userId: req.user._id 
  });
  if (!device) {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(mediaFile);
}));

// Delete media file
router.delete('/:fileId', authMiddleware, asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  const mediaFile = await MediaFile.findById(fileId);
  if (!mediaFile) {
    return res.status(404).json({ message: 'Media file not found' });
  }

  // Verify device ownership
  const device = await GpsTracker.findOne({ 
    _id: mediaFile.deviceId, 
    userId: req.user._id 
  });
  if (!device) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    // Delete from Cloudinary
    if (mediaFile.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(
        mediaFile.cloudinaryPublicId,
        { resource_type: mediaFile.fileType === 'video' ? 'video' : 'image' }
      );
    }

    // Delete from database
    await MediaFile.findByIdAndDelete(fileId);

    res.json({ message: 'Media file deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
}));

// Get media analytics
router.get('/analytics/:deviceId', authMiddleware, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { period = '30d' } = req.query;

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user._id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  const periodDays = parseInt(period.replace('d', ''));
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Get file type distribution
  const typeStats = await MediaFile.aggregate([
    {
      $match: {
        deviceId: device._id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$fileType',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }
    }
  ]);

  // Get capture reason distribution
  const reasonStats = await MediaFile.aggregate([
    {
      $match: {
        deviceId: device._id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$captureReason',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get daily capture counts
  const dailyStats = await MediaFile.aggregate([
    {
      $match: {
        deviceId: device._id,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  // Get total storage usage
  const storageStats = await MediaFile.aggregate([
    {
      $match: { deviceId: device._id }
    },
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        photoCount: {
          $sum: { $cond: [{ $eq: ['$fileType', 'photo'] }, 1, 0] }
        },
        videoCount: {
          $sum: { $cond: [{ $eq: ['$fileType', 'video'] }, 1, 0] }
        },
        securityFiles: {
          $sum: { $cond: ['$isSecurityRelated', 1, 0] }
        }
      }
    }
  ]);

  res.json({
    period,
    typeStats,
    reasonStats,
    dailyStats,
    storageStats: storageStats[0] || {
      totalFiles: 0,
      totalSize: 0,
      photoCount: 0,
      videoCount: 0,
      securityFiles: 0
    }
  });
}));

// Bulk operations
router.post('/bulk-delete', authMiddleware, asyncHandler(async (req, res) => {
  const { fileIds, deviceId } = req.body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: 'Invalid file IDs provided' });
  }

  // Verify device ownership
  const device = await GpsTracker.findOne({ _id: deviceId, userId: req.user._id });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  try {
    const mediaFiles = await MediaFile.find({
      _id: { $in: fileIds },
      deviceId
    });

    const deletePromises = mediaFiles.map(async (file) => {
      // Delete from Cloudinary
      if (file.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(
          file.cloudinaryPublicId,
          { resource_type: file.fileType === 'video' ? 'video' : 'image' }
        );
      }
    });

    await Promise.all(deletePromises);

    // Delete from database
    const deleteResult = await MediaFile.deleteMany({
      _id: { $in: fileIds },
      deviceId
    });

    res.json({
      message: `${deleteResult.deletedCount} files deleted successfully`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Bulk delete failed', error: error.message });
  }
}));

export default router;
