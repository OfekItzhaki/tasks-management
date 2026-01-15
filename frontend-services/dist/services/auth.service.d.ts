import { LoginDto, LoginResponse, User } from '../types';
export declare class AuthService {
    /**
     * Login with email and password
     */
    login(credentials: LoginDto): Promise<LoginResponse>;
    /**
     * Logout (removes token from storage)
     */
    logout(): void;
    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean;
    /**
     * Get stored token
     */
    getToken(): string | null;
    /**
     * Verify email with token
     */
    verifyEmail(token: string): Promise<User>;
    /**
     * Resend verification email
     */
    resendVerification(email: string): Promise<User>;
}
export declare const authService: AuthService;
