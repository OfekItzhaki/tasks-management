import { apiClient } from '../utils/api-client';
export class ListsService {
    /**
     * Get all lists for authenticated user
     */
    async getAll() {
        return apiClient.get('/todo-lists');
    }
    /**
     * Get list by ID
     */
    async getById(id) {
        return apiClient.get(`/todo-lists/${id}`);
    }
    /**
     * Create a new list
     */
    async create(data) {
        return apiClient.post('/todo-lists', data);
    }
    /**
     * Update list
     */
    async update(id, data) {
        return apiClient.patch(`/todo-lists/${id}`, data);
    }
    /**
     * Delete list (soft delete)
     */
    async delete(id) {
        return apiClient.delete(`/todo-lists/${id}`);
    }
    /**
     * Get user's lists (alias for getAll)
     */
    async getMyLists() {
        return apiClient.get('/me/lists');
    }
}
export const listsService = new ListsService();
