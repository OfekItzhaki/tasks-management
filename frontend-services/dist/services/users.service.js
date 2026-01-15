import { apiClient } from '../utils/api-client';
export class UsersService {
    /**
     * Register a new user
     */
    async create(data) {
        return apiClient.post('/users', data);
    }
    /**
     * Get current authenticated user
     * Note: Backend returns an array, but we extract the first element
     * as this endpoint always returns a single user
     */
    async getCurrent() {
        const users = await apiClient.get('/users');
        if (!users || users.length === 0) {
            throw new Error('No authenticated user found');
        }
        return users[0];
    }
    /**
     * Get user by ID
     */
    async getById(id) {
        return apiClient.get(`/users/${id}`);
    }
    /**
     * Update user profile
     */
    async update(id, data) {
        return apiClient.patch(`/users/${id}`, data);
    }
    /**
     * Soft delete user account
     */
    async delete(id) {
        return apiClient.delete(`/users/${id}`);
    }
    /**
     * Upload profile picture
     */
    async uploadAvatar(id, file) {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/users/${id}/upload-avatar`, formData, {
            headers: {
            // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
            },
        });
    }
}
export const usersService = new UsersService();
