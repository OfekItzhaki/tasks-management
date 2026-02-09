// Get API base URL - works in both Node.js and browser environments
const getApiBaseUrl = (): string => {
  let url = 'http://localhost:3000';

  // Check for Vite environment variables (import.meta.env is injected at build time)
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__VITE_API_URL__) {
      url = win.__VITE_API_URL__;
    } else {
      // Fallback: Detect production domain and use corresponding API URL
      const hostname = window.location.hostname;
      if (hostname === 'horizon-flux.ofeklabs.dev' || hostname.includes('vercel.app')) {
        url = 'https://api.horizon-flux.ofeklabs.dev';
      }
    }
  }
  // In Node.js/SSR, check process.env
  else if (typeof process !== 'undefined' && (process as any).env) {
    const env = (process as any).env;
    const vUrl = env['VITE_API_URL'];
    const aUrl = env['API_BASE_URL'];
    const eUrl = env['EXPO_PUBLIC_API_URL'];

    if (vUrl && vUrl.trim().length > 0) url = vUrl;
    else if (aUrl && aUrl.trim().length > 0) url = aUrl;
    else if (eUrl && eUrl.trim().length > 0) url = eUrl;
  }

  // Cleanup: Remove trailing slash
  url = url.replace(/\/$/, '');

  // CRITICAL: Ensure /api/v1 prefix is present for ALL environments.
  // We check for /api/v1, /api/v1/, etc.
  const hasPrefix = url.toLowerCase().includes('/api/v1');

  if (!hasPrefix) {
    return `${url}/api/v1`;
  }

  return url;
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
export const getAssetUrl = (
  path: string,
  includeCacheBuster = true,
): string => {
  if (!path) return '';

  // If already an absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const root = API_CONFIG.baseURL.split('/api/v1')[0].replace(/\/$/, '');

  // Normalize path and strip any existing /uploads/ or uploads/ prefix
  let cleanPath = path.replace(/\\/g, '/');
  cleanPath = cleanPath.replace(/^(\/)?uploads\//, '');
  cleanPath = cleanPath.replace(/^\//, '');

  const url = `${root}/uploads/${cleanPath}`;

  if (includeCacheBuster) {
    // Add a timestamp or hash based on the filename if possible, 
    // but a simple ?t= is most reliable for immediate updates
    const buster = Date.now();
    return `${url}?t=${buster}`;
  }

  return url;
};
