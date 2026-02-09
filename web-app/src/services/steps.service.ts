import {
  stepsService as frontendStepsService,
  Step,
  CreateStepDto,
  UpdateStepDto,
} from '@tasks-management/frontend-services';

class StepsService {
  async getStepsByTask(taskId: string): Promise<Step[]> {
    return frontendStepsService.getByTask(taskId);
  }

  async createStep(taskId: string, data: CreateStepDto): Promise<Step> {
    return frontendStepsService.create(taskId, data);
  }

  async updateStep(id: string, data: UpdateStepDto): Promise<Step> {
    return frontendStepsService.update(id, data);
  }

  async deleteStep(id: string): Promise<Step> {
    return frontendStepsService.delete(id);
  }

  async reorderSteps(taskId: string, stepIds: string[]): Promise<Step[]> {
    return frontendStepsService.reorder(taskId, stepIds);
  }
}

export const stepsService = new StepsService();
