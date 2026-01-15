import { User, CreateUserDto, UpdateUserDto } from '../types';
export declare class UsersService {
    /**
     * Register a new user
     */
    create(data: CreateUserDto): Promise<User>;
    /**
     * Get current authenticated user
     * Note: Backend returns an array, but we extract the first element
     * as this endpoint always returns a single user
     */
    getCurrent(): Promise<User>;
    /**
     * Get user by ID
     */
    getById(id: number): Promise<User>;
    /**
     * Update user profile
     */
    update(id: number, data: UpdateUserDto): Promise<User>;
    /**
     * Soft delete user account
     */
    delete(id: number): Promise<User>;
    /**
     * Upload profile picture
     */
    uploadAvatar(id: number, file: File): Promise<User>;
}
export declare const usersService: UsersService;
