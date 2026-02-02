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
import { ENV } from './env';

export const API_CONFIG = {
  // Set EXPO_PUBLIC_API_URL in .env. Never use localhost for physical device / Android emulator.
  baseURL: ENV.EXPO_PUBLIC_API_URL || (__DEV__
    ? 'http://192.168.68.54:3000'  // Dev fallback: use your machine's IP (ipconfig / ifconfig)
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

/**
 * Helper for assets that are outside /api/v1 (like /uploads)
 */
export const getAssetUrl = (path: string): string => {
  const root = API_CONFIG.baseURL.split('/api/v1')[0];
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If no /api/v1 found (fallback), just use base
  if (API_CONFIG.baseURL.indexOf('/api/v1') === -1) {
    return `${API_CONFIG.baseURL.replace(/\/$/, '')}${cleanPath}`;
  }

  return `${root}${cleanPath}`;
};
