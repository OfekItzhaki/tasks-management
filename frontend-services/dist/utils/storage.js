/**
 * Token storage utilities
 * Can be customized to use localStorage, sessionStorage, or secure storage
 */
export class TokenStorage {
    static getToken() {
        if (typeof window === 'undefined')
            return null;
        return localStorage.getItem(this.TOKEN_KEY);
    }
    static setToken(token) {
        if (typeof window === 'undefined')
            return;
        localStorage.setItem(this.TOKEN_KEY, token);
    }
    static removeToken() {
        if (typeof window === 'undefined')
            return;
        localStorage.removeItem(this.TOKEN_KEY);
    }
    static hasToken() {
        return this.getToken() !== null;
    }
}
TokenStorage.TOKEN_KEY = 'tasks_management_token';
