import { apiClient } from '../utils/api-client';
import { ListShare, ShareListDto, ToDoList } from '../types';

export class SharingService {
  /**
   * Share a list with a user
   */
  async shareList(
    todoListId: number,
    data: ShareListDto,
  ): Promise<ListShare> {
    return apiClient.post<ListShare>(
      `/list-shares/todo-list/${todoListId}`,
      data,
    );
  }

  /**
   * Get all lists shared with a user
   */
  async getSharedLists(userId: number): Promise<ToDoList[]> {
    return apiClient.get<ToDoList[]>(`/list-shares/user/${userId}`);
  }

  /**
   * Get all users a list is shared with
   */
  async getListShares(todoListId: number): Promise<ListShare[]> {
    return apiClient.get<ListShare[]>(
      `/list-shares/todo-list/${todoListId}`,
    );
  }

  /**
   * Unshare a list with a user
   */
  async unshareList(todoListId: number, userId: number): Promise<void> {
    return apiClient.delete<void>(
      `/list-shares/todo-list/${todoListId}/user/${userId}`,
    );
  }
}

export const sharingService = new SharingService();


