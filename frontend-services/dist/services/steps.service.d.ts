import { Step, CreateStepDto, UpdateStepDto } from '../types';
export declare class StepsService {
    /**
     * Get all steps for a task
     */
    getByTask(taskId: number): Promise<Step[]>;
    /**
     * Create a new step
     */
    create(taskId: number, data: CreateStepDto): Promise<Step>;
    /**
     * Update step
     */
    update(id: number, data: UpdateStepDto): Promise<Step>;
    /**
     * Delete step (soft delete)
     */
    delete(id: number): Promise<Step>;
    /**
     * Reorder steps for a task
     */
    reorder(taskId: number, stepIds: number[]): Promise<Step[]>;
}
export declare const stepsService: StepsService;
