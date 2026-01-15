import { apiClient } from '../utils/api-client';
import { TokenStorage } from '../utils/storage';
export class AuthService {
    /**
     * Login with email and password
     */
    async login(credentials) {
        const response = await apiClient.post('/auth/login', credentials);
        TokenStorage.setToken(response.accessToken);
        return response;
    }
    /**
     * Logout (removes token from storage)
     */
    logout() {
        TokenStorage.removeToken();
    }
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return TokenStorage.hasToken();
    }
    /**
     * Get stored token
     */
    getToken() {
        return TokenStorage.getToken();
    }
    /**
     * Verify email with token
     */
    async verifyEmail(token) {
        // Encode token in path segment to handle special characters
        const encodedToken = encodeURIComponent(token);
        return apiClient.post(`/auth/verify-email/${encodedToken}`);
    }
    /**
     * Resend verification email
     */
    async resendVerification(email) {
        return apiClient.post('/auth/resend-verification', { email });
    }
}
export const authService = new AuthService();
