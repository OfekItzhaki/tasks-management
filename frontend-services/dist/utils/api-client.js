import { getApiUrl } from '../config';
import { TokenStorage } from './storage';
export class ApiClient {
    async request(method, path, options = {}) {
        const url = getApiUrl(path);
        const token = TokenStorage.getToken();
        // Extract headers and method from options to prevent them from overriding our defaults
        const { headers: optionsHeaders, method: optionsMethod, ...restOptions } = options;
        // Check if body is FormData
        const isFormData = restOptions.body instanceof FormData;
        // Build headers: start with defaults, merge user-provided headers, then add auth
        const headers = {
            ...optionsHeaders,
        };
        // Only set Content-Type to JSON if not FormData and not already set
        // Browser will automatically set Content-Type with boundary for FormData
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        else if (isFormData && headers['Content-Type']) {
            // Remove Content-Type if it's set for FormData (browser will set it with boundary)
            delete headers['Content-Type'];
        }
        // Authorization header should always be added if token exists (takes precedence)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Build config: method parameter always takes precedence, then our headers, then rest of options
        const config = {
            ...restOptions,
            method, // Method parameter always takes precedence over options.method
            headers, // Our carefully built headers take precedence over options.headers
        };
        try {
            const response = await fetch(url, config);
            // Handle empty responses (204 No Content)
            if (response.status === 204) {
                return undefined;
            }
            let data;
            try {
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            }
            catch (parseError) {
                // Handle invalid JSON responses
                if (parseError instanceof SyntaxError) {
                    throw {
                        statusCode: response.status,
                        message: 'Invalid JSON response from server',
                        error: 'JSON_PARSE_ERROR',
                    };
                }
                throw parseError;
            }
            if (!response.ok) {
                const error = {
                    statusCode: response.status,
                    message: data?.message || 'An error occurred',
                    error: data?.error,
                };
                throw error;
            }
            return data;
        }
        catch (error) {
            // If it's already an ApiError, rethrow it
            if (error && typeof error === 'object' && 'statusCode' in error) {
                throw error;
            }
            // Handle network errors
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw {
                    statusCode: 0,
                    message: 'Network error: Could not connect to the server',
                };
            }
            // Handle any other errors (including SyntaxError from JSON parsing)
            throw {
                statusCode: 0,
                message: error instanceof Error ? error.message : 'An unexpected error occurred',
            };
        }
    }
    async get(path, options) {
        return this.request('GET', path, options);
    }
    async post(path, body, options) {
        const isFormData = body instanceof FormData;
        return this.request('POST', path, {
            ...options,
            body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        });
    }
    async patch(path, body, options) {
        return this.request('PATCH', path, {
            ...options,
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    async delete(path, options) {
        return this.request('DELETE', path, options);
    }
}
export const apiClient = new ApiClient();
