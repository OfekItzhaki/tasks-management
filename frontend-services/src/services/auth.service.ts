import { apiClient } from '../utils/api-client';
import { TokenStorage } from '../utils/storage';
import { LoginDto, LoginResponse, User } from '../types';

export class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials,
    );
    TokenStorage.setToken(response.accessToken);
    return response;
  }

  /**
   * Logout (removes token from storage)
   */
  logout(): void {
    TokenStorage.removeToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return TokenStorage.hasToken();
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return TokenStorage.getToken();
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    // Encode token in path segment to handle special characters
    const encodedToken = encodeURIComponent(token);
    return apiClient.post<User>(`/auth/verify-email/${encodedToken}`);
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<User> {
    return apiClient.post<User>('/auth/resend-verification', { email });
  }
}

export const authService = new AuthService();


