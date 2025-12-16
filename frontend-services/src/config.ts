export const API_CONFIG = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
  timeout: 30000, // 30 seconds
};

export const getApiUrl = (path: string): string => {
  const base = API_CONFIG.baseURL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};


