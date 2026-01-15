import { ToDoList, CreateToDoListDto, UpdateToDoListDto } from '../types';
export declare class ListsService {
    /**
     * Get all lists for authenticated user
     */
    getAll(): Promise<ToDoList[]>;
    /**
     * Get list by ID
     */
    getById(id: number): Promise<ToDoList>;
    /**
     * Create a new list
     */
    create(data: CreateToDoListDto): Promise<ToDoList>;
    /**
     * Update list
     */
    update(id: number, data: UpdateToDoListDto): Promise<ToDoList>;
    /**
     * Delete list (soft delete)
     */
    delete(id: number): Promise<ToDoList>;
    /**
     * Get user's lists (alias for getAll)
     */
    getMyLists(): Promise<ToDoList[]>;
}
export declare const listsService: ListsService;
