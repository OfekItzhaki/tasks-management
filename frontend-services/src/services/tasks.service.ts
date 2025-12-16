import { apiClient } from '../utils/api-client';
import { Task, CreateTaskDto, UpdateTaskDto } from '../types';

export class TasksService {
  /**
   * Get all tasks (optionally filtered by list)
   */
  async getAll(todoListId?: number): Promise<Task[]> {
    const path = todoListId
      ? `/tasks?todoListId=${todoListId}`
      : '/tasks';
    return apiClient.get<Task[]>(path);
  }

  /**
   * Get tasks for a specific date
   */
  async getByDate(date?: string): Promise<Task[]> {
    const path = date ? `/tasks/by-date?date=${date}` : '/tasks/by-date';
    return apiClient.get<Task[]>(path);
  }

  /**
   * Get task by ID
   */
  async getById(id: number): Promise<Task> {
    return apiClient.get<Task>(`/tasks/${id}`);
  }

  /**
   * Create a task in a list
   */
  async create(todoListId: number, data: CreateTaskDto): Promise<Task> {
    return apiClient.post<Task>(`/tasks/todo-list/${todoListId}`, data);
  }

  /**
   * Update task
   */
  async update(id: number, data: UpdateTaskDto): Promise<Task> {
    return apiClient.patch<Task>(`/tasks/${id}`, data);
  }

  /**
   * Delete task (soft delete)
   */
  async delete(id: number): Promise<Task> {
    return apiClient.delete<Task>(`/tasks/${id}`);
  }

  /**
   * Get user's tasks (optionally filtered by list)
   */
  async getMyTasks(todoListId?: number): Promise<Task[]> {
    const path = todoListId
      ? `/me/tasks?todoListId=${todoListId}`
      : '/me/tasks';
    return apiClient.get<Task[]>(path);
  }
}

export const tasksService = new TasksService();


