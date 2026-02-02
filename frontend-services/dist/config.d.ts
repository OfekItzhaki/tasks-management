export declare const API_CONFIG: {
    baseURL: string;
    timeout: number;
};
export declare const getApiUrl: (path: string) => string;
/**
 * Helper to get the root URL (without /api/v1) for static assets like uploads
 */
export declare const getAssetUrl: (path: string) => string;
