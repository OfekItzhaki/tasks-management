import { apiClient, ApiError } from '../utils/api-client';
import { Step, CreateStepDto, UpdateStepDto, ReorderStepsDto } from '../types';

export class StepsService {
  /**
   * Get all steps for a task
   */
  async getByTask(taskId: string): Promise<Step[]> {
    try {
      const response = await apiClient.get<Step[]>(`/tasks/${taskId}/steps`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to fetch steps');
    }
  }

  /**
   * Create a step
   */
  async create(taskId: string, data: CreateStepDto): Promise<Step> {
    try {
      const response = await apiClient.post<Step>(
        `/tasks/${taskId}/steps`,
        data,
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to create step');
    }
  }

  /**
   * Update a step
   */
  async update(id: string, data: UpdateStepDto): Promise<Step> {
    try {
      const response = await apiClient.patch<Step>(`/steps/${id}`, data);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to update step');
    }
  }

  /**
   * Delete a step (soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      await apiClient.delete(`/steps/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to delete step');
    }
  }

  /**
   * Reorder steps for a task
   */
  async reorder(taskId: string, stepIds: string[]): Promise<Step[]> {
    try {
      const response = await apiClient.patch<Step[]>(
        `/tasks/${taskId}/steps/reorder`,
        { stepIds } as ReorderStepsDto,
      );
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to reorder steps');
    }
  }
}

export const stepsService = new StepsService();








