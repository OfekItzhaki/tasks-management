import { apiClient } from '../utils/api-client';
import { User, CreateUserDto, UpdateUserDto } from '../types';

export class UsersService {
  /**
   * Register a new user
   */
  async create(data: CreateUserDto): Promise<User> {
    return apiClient.post<User>('/users', data);
  }

  /**
   * Get current authenticated user
   */
  async getCurrent(): Promise<User[]> {
    return apiClient.get<User[]>('/users');
  }

  /**
   * Get user by ID
   */
  async getById(id: number): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  }

  /**
   * Update user profile
   */
  async update(id: number, data: UpdateUserDto): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, data);
  }

  /**
   * Soft delete user account
   */
  async delete(id: number): Promise<User> {
    return apiClient.delete<User>(`/users/${id}`);
  }
}

export const usersService = new UsersService();


