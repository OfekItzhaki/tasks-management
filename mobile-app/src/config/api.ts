/**
 * API Configuration
 * 
 * Production: Set EXPO_PUBLIC_API_URL environment variable to your Render backend URL
 * Development: Uses local IP or localhost
 * 
 * Priority:
 * 1. EXPO_PUBLIC_API_URL environment variable (for production builds)
 * 2. Fallback to development URL (localhost or local IP)
 */
export const API_CONFIG = {
  // Set EXPO_PUBLIC_API_URL in .env. Never use localhost for physical device / Android emulator.
  baseURL: process.env.EXPO_PUBLIC_API_URL || (__DEV__
    ? 'http://192.168.7.97:3000'  // Dev fallback: use your machine's IP (ipconfig / ifconfig)
    : 'https://tasksmanagement-lv54.onrender.com'),
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
