import { apiClient } from '../utils/api-client';
export class TasksService {
    /**
     * Get all tasks (optionally filtered by list)
     */
    async getAll(todoListId) {
        const path = todoListId
            ? `/tasks?todoListId=${todoListId}` // Numeric IDs are safe, no encoding needed
            : '/tasks';
        return apiClient.get(path);
    }
    /**
     * Get tasks for a specific date
     */
    async getByDate(date) {
        if (date) {
            const encodedDate = encodeURIComponent(date);
            return apiClient.get(`/tasks/by-date?date=${encodedDate}`);
        }
        return apiClient.get('/tasks/by-date');
    }
    /**
     * Get task by ID
     */
    async getById(id) {
        return apiClient.get(`/tasks/${id}`);
    }
    /**
     * Create a task in a list
     */
    async create(todoListId, data) {
        return apiClient.post(`/tasks/todo-list/${todoListId}`, data);
    }
    /**
     * Update task
     */
    async update(id, data) {
        return apiClient.patch(`/tasks/${id}`, data);
    }
    /**
     * Delete task (soft delete)
     */
    async delete(id) {
        return apiClient.delete(`/tasks/${id}`);
    }
    /**
     * Get user's tasks (optionally filtered by list)
     */
    async getMyTasks(todoListId) {
        const path = todoListId
            ? `/me/tasks?todoListId=${todoListId}` // Numeric IDs are safe, no encoding needed
            : '/me/tasks';
        return apiClient.get(path);
    }
}
export const tasksService = new TasksService();
