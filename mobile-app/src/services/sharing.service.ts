import { apiClient, ApiError } from '../utils/api-client';
import { ToDoList, ShareListDto } from '../types';

export class SharingService {
  /**
   * Share a list with a user
   */
  async shareList(todoListId: number, data: ShareListDto): Promise<void> {
    try {
      await apiClient.post(`/list-shares/todo-list/${todoListId}`, data);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to share list');
    }
  }

  /**
   * Get all lists shared with a user
   */
  async getSharedLists(userId: number): Promise<ToDoList[]> {
    try {
      const response = await apiClient.get<ToDoList[]>(`/list-shares/user/${userId}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to fetch shared lists');
    }
  }

  /**
   * Get all users a list is shared with
   */
  async getListShares(todoListId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/list-shares/todo-list/${todoListId}`);
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to fetch list shares');
    }
  }

  /**
   * Unshare a list with a user
   */
  async unshareList(todoListId: number, userId: number): Promise<void> {
    try {
      await apiClient.delete(`/list-shares/todo-list/${todoListId}/user/${userId}`);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to unshare list');
    }
  }
}

export const sharingService = new SharingService();
