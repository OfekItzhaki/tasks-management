/**
 * Token storage utilities
 * Can be customized to use localStorage, sessionStorage, or secure storage
 */
export declare class TokenStorage {
    private static readonly TOKEN_KEY;
    static getToken(): string | null;
    static setToken(token: string): void;
    static removeToken(): void;
    static hasToken(): boolean;
}
