import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GpsTracker from './models/GpsTracker.js';

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/trackerapp');
  console.log('Connected to MongoDB');
  
  const allDevices = await GpsTracker.find({});
  console.log('Total devices found:', allDevices.length);
  
  const devices = await GpsTracker.find({ platform: 'mobile' });
  console.log('Mobile devices found:', devices.length);
  
  allDevices.forEach(device => {
    console.log('Device:', {
      deviceId: device.deviceId,
      deviceCode: device.device?.deviceCode,
      platform: device.platform,
      activationStatus: device.device?.activationStatus
    });
  });
  
  // Also check devices with the specific code
  const specificDevice = await GpsTracker.findOne({
    $or: [
      { deviceId: '00006165763' },
      { deviceId: '0000-6165-7633' },
      { 'device.deviceCode': '0000-6165-7633' }
    ]
  });
  
  if (specificDevice) {
    console.log('Found specific device:', {
      deviceId: specificDevice.deviceId,
      deviceCode: specificDevice.device?.deviceCode,
      platform: specificDevice.platform,
      activationStatus: specificDevice.device?.activationStatus
    });
  } else {
    console.log('Specific device code 0000-6165-7633 not found');
  }
  
  await mongoose.disconnect();
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
