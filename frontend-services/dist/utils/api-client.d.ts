export declare class ApiClient {
    private request;
    get<T>(path: string, options?: RequestInit): Promise<T>;
    post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>;
    patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T>;
    delete<T>(path: string, options?: RequestInit): Promise<T>;
}
export declare const apiClient: ApiClient;
