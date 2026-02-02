import { ENV } from './env';

// API configuration
export const API_CONFIG = {
  baseURL: ENV.VITE_API_BASE_URL,
};

/**
 * Get full API URL for a relative path.
 * Automatically handles /api/v1 prefix.
 */
export const getApiUrl = (path: string): string => {
  let base = API_CONFIG.baseURL.replace(/\/$/, '');

  // Ensure /api/v1 is present for functionality
  if (!base.includes('/api/v1')) {
    base = `${base}/api/v1`;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${base}${cleanPath}`;
};

/**
 * Get root URL for assets (outside /api/v1).
 */
export const getAssetUrl = (path: string): string => {
  const base = API_CONFIG.baseURL.replace(/\/$/, '');

  // Strip /api/v1 if it was accidentally included in VITE_API_BASE_URL
  const root = base.split('/api/v1')[0];
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${root}${cleanPath}`;
};
