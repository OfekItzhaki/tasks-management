import { apiClient } from '../utils/api-client';
export class StepsService {
    /**
     * Get all steps for a task
     */
    async getByTask(taskId) {
        return apiClient.get(`/tasks/${taskId}/steps`);
    }
    /**
     * Create a new step
     */
    async create(taskId, data) {
        return apiClient.post(`/tasks/${taskId}/steps`, data);
    }
    /**
     * Update step
     */
    async update(id, data) {
        return apiClient.patch(`/steps/${id}`, data);
    }
    /**
     * Delete step (soft delete)
     */
    async delete(id) {
        return apiClient.delete(`/steps/${id}`);
    }
    /**
     * Reorder steps for a task
     */
    async reorder(taskId, stepIds) {
        return apiClient.patch(`/tasks/${taskId}/steps/reorder`, { stepIds });
    }
}
export const stepsService = new StepsService();
