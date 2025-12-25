/**
 * API Configuration
 * Set your backend API URL here
 * 
 * IMPORTANT: For physical devices, use your computer's IP address instead of localhost
 * Example: http://192.168.1.100:3000
 * 
 * To find your IP:
 * - Windows: ipconfig (look for IPv4 Address)
 * - Mac/Linux: ifconfig or ip addr
 */
export const API_CONFIG = {
  // Set EXPO_PUBLIC_API_URL in .env file (copy from .env.example)
  // For physical devices, use your computer's IP address
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
};

export const getApiUrl = (endpoint: string): string => {
  const base = API_CONFIG.baseURL.replace(/\/$/, ''); // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

// Log the API URL in development (helps with debugging)
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('API Base URL:', API_CONFIG.baseURL);
}
