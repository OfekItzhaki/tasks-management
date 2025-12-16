import { getApiUrl, API_CONFIG } from '../config';
import { TokenStorage } from './storage';
import { ApiError } from '../types';

export class ApiClient {
  private async request<T>(
    method: string,
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = getApiUrl(path);
    const token = TokenStorage.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return null as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          statusCode: response.status,
          message: data.message || 'An error occurred',
          error: data.error,
        };
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          statusCode: 0,
          message: 'Network error: Could not connect to the server',
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }
}

export const apiClient = new ApiClient();


