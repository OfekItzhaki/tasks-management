import { Task, CreateTaskDto, UpdateTaskDto } from '../types';
export declare class TasksService {
    /**
     * Get all tasks (optionally filtered by list)
     */
    getAll(todoListId?: number): Promise<Task[]>;
    /**
     * Get tasks for a specific date
     */
    getByDate(date?: string): Promise<Task[]>;
    /**
     * Get task by ID
     */
    getById(id: number): Promise<Task>;
    /**
     * Create a task in a list
     */
    create(todoListId: number, data: CreateTaskDto): Promise<Task>;
    /**
     * Update task
     */
    update(id: number, data: UpdateTaskDto): Promise<Task>;
    /**
     * Delete task (soft delete)
     */
    delete(id: number): Promise<Task>;
    /**
     * Get user's tasks (optionally filtered by list)
     */
    getMyTasks(todoListId?: number): Promise<Task[]>;
}
export declare const tasksService: TasksService;
