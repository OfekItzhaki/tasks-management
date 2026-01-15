import { apiClient } from '../utils/api-client';
export class SharingService {
    /**
     * Share a list with a user
     */
    async shareList(todoListId, data) {
        return apiClient.post(`/list-shares/todo-list/${todoListId}`, data);
    }
    /**
     * Get all lists shared with a user
     */
    async getSharedLists(userId) {
        return apiClient.get(`/list-shares/user/${userId}`);
    }
    /**
     * Get all users a list is shared with
     */
    async getListShares(todoListId) {
        return apiClient.get(`/list-shares/todo-list/${todoListId}`);
    }
    /**
     * Unshare a list with a user
     */
    async unshareList(todoListId, userId) {
        return apiClient.delete(`/list-shares/todo-list/${todoListId}/user/${userId}`);
    }
}
export const sharingService = new SharingService();
