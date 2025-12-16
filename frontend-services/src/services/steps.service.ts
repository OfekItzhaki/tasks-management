import { apiClient } from '../utils/api-client';
import { Step, CreateStepDto, UpdateStepDto, ReorderStepsDto } from '../types';

export class StepsService {
  /**
   * Get all steps for a task
   */
  async getByTask(taskId: number): Promise<Step[]> {
    return apiClient.get<Step[]>(`/tasks/${taskId}/steps`);
  }

  /**
   * Create a new step
   */
  async create(taskId: number, data: CreateStepDto): Promise<Step> {
    return apiClient.post<Step>(`/tasks/${taskId}/steps`, data);
  }

  /**
   * Update step
   */
  async update(id: number, data: UpdateStepDto): Promise<Step> {
    return apiClient.patch<Step>(`/steps/${id}`, data);
  }

  /**
   * Delete step (soft delete)
   */
  async delete(id: number): Promise<Step> {
    return apiClient.delete<Step>(`/steps/${id}`);
  }

  /**
   * Reorder steps for a task
   */
  async reorder(taskId: number, stepIds: number[]): Promise<Step[]> {
    return apiClient.patch<Step[]>(
      `/tasks/${taskId}/steps/reorder`,
      { stepIds } as ReorderStepsDto,
    );
  }
}

export const stepsService = new StepsService();


