// Get API base URL - works in both Node.js and browser environments
const getApiBaseUrl = (): string => {
  // We use process.env as the universal bridge. 
  // - Node/Jest: works natively
  // - Expo: works natively
  // - Vite: we polyfill this in vite.config.ts
  if (typeof process !== 'undefined' && process.env) {
    const env = process.env;
    if (env.EXPO_PUBLIC_API_URL) return env.EXPO_PUBLIC_API_URL;
    if (env.API_BASE_URL) return env.API_BASE_URL;
    if ((env as any).VITE_API_URL) return (env as any).VITE_API_URL;
  }

  return 'http://localhost:3000';
};

export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000, // 30 seconds
};

export const getApiUrl = (path: string): string => {
  const base = API_CONFIG.baseURL.replace(/\/$/, '');

  // Handle absolute paths by stripping the leading slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Special case: if path is already an absolute URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${base}${cleanPath}`;
};

/**
 * Helper to get the root URL (without /api/v1) for static assets like uploads
 */
export const getAssetUrl = (path: string): string => {
  const root = API_CONFIG.baseURL.split('/api/v1')[0];
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${root}${cleanPath}`;
};
