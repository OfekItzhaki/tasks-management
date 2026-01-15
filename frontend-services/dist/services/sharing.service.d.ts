import { ListShare, ShareListDto, ToDoList } from '../types';
export declare class SharingService {
    /**
     * Share a list with a user
     */
    shareList(todoListId: number, data: ShareListDto): Promise<ListShare>;
    /**
     * Get all lists shared with a user
     */
    getSharedLists(userId: number): Promise<ToDoList[]>;
    /**
     * Get all users a list is shared with
     */
    getListShares(todoListId: number): Promise<ListShare[]>;
    /**
     * Unshare a list with a user
     */
    unshareList(todoListId: number, userId: number): Promise<void>;
}
export declare const sharingService: SharingService;
