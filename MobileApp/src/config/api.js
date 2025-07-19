// API Configuration for Mobile App
import Constants from 'expo-constants';

// Get the local IP address from Expo
const getApiUrl = () => {
  // In development, use your machine's IP address
  // You can find your IP by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
  const developmentUrl = 'http://10.227.121.225:5000'; // Replace with your actual IP
  
  // In production, use your deployed backend URL
  const productionUrl = 'https://your-production-api.com';
  
  // Use development URL in Expo Go, production URL in standalone builds
  return __DEV__ ? developmentUrl : productionUrl;
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/signup`,
  CHECK_AUTH: `${API_BASE_URL}/api/auth/check-auth`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  
  // User management
  USER_TRACKERS: `${API_BASE_URL}/api/user/trackers`,
  ASSIGN_TRACKER: `${API_BASE_URL}/api/user/assign-tracker`,
  UPDATE_USER: `${API_BASE_URL}/api/user/update-user`,
  UPDATE_PASSWORD: `${API_BASE_URL}/api/user/updatepassword`,
  UPDATE_NOTIFICATIONS: `${API_BASE_URL}/api/user/update-notifications`,
  
  // Device management
  DEVICE_DATA: `${API_BASE_URL}/api/device/device-data`,
  LOCATION_UPDATE: `${API_BASE_URL}/api/device/location`,
  DEVICE_EXPIRATION: `${API_BASE_URL}/api/device/expiration-status`,
  ACTIVATION_STATUS: `${API_BASE_URL}/api/device/activation-status`,
  
  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
  MARK_READ: `${API_BASE_URL}/api/notifications/mark-read`,
  
  // Security endpoints
  SECURITY: `${API_BASE_URL}/api/security`,
  
  // Device registration endpoints
  VALIDATE_DEVICE_CODE: `${API_BASE_URL}/api/user/validate-device-code`,
  ACTIVATE_DEVICE: `${API_BASE_URL}/api/user/activate-device`,
  REGISTER_MOBILE_DEVICE: `${API_BASE_URL}/api/user/register-mobile-device`,
  VALIDATE_ACTIVATION: `${API_BASE_URL}/api/user/devices/validate-activation`,
  
  // Media endpoints
  MEDIA: `${API_BASE_URL}/api/media`,
  
  // Admin endpoints
  ADMIN: `${API_BASE_URL}/api/admin`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`,
};

console.log('API Base URL:', API_BASE_URL);
console.log('Login Endpoint:', API_ENDPOINTS.LOGIN);
