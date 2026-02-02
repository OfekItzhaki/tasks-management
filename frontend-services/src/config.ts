import { z } from 'zod';

// Define the schema for frontend configuration
const apiConfigSchema = z.object({
  baseURL: z.string().url(),
  timeout: z.number().int().positive().default(30000),
});

/**
 * Get API base URL - works in both Node.js and browser environments.
 * Automatically adds the /api/v1 prefix if not present.
 */
const getApiBaseUrl = (): string => {
  let url = 'http://localhost:3000';

  // Node.js environment (e.g., during builds)
  if (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) {
    url = process.env.API_BASE_URL;
  }

  // Ensure versioning prefix is present
  if (!url.includes('/api/v1')) {
    url = `${url.replace(/\/$/, '')}/api/v1`;
  }

  return url;
};

const rawConfig = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
};

// Validate config on startup
const validatedConfig = apiConfigSchema.parse(rawConfig);

export const API_CONFIG = validatedConfig;

export const getApiUrl = (path: string): string => {
  const base = API_CONFIG.baseURL.replace(/\/$/, '');

  // Handle absolute paths by stripping the leading slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Special case: if Path is already an absolute URL, return it
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
