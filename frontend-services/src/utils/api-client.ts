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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
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

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        // Handle invalid JSON responses
        if (parseError instanceof SyntaxError) {
          throw {
            statusCode: response.status,
            message: 'Invalid JSON response from server',
            error: 'JSON_PARSE_ERROR',
          } as ApiError;
        }
        throw parseError;
      }

      if (!response.ok) {
        const error: ApiError = {
          statusCode: response.status,
          message: data?.message || 'An error occurred',
          error: data?.error,
        };
        throw error;
      }

      return data;
    } catch (error) {
      // If it's already an ApiError, rethrow it
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw {
          statusCode: 0,
          message: 'Network error: Could not connect to the server',
        } as ApiError;
      }
      
      // Handle any other errors (including SyntaxError from JSON parsing)
      throw {
        statusCode: 0,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      } as ApiError;
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


