// User Types
export enum NotificationFrequency {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  profilePicture: string | null;
  emailVerified: boolean;
  notificationFrequency: NotificationFrequency;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
  profilePicture?: string;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  profilePicture?: string;
  password?: string;
  notificationFrequency?: NotificationFrequency;
}

// Auth Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: Omit<User, 'passwordHash' | 'emailVerificationOtp'>;
}

// List Types
export enum ListType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
  FINISHED = 'FINISHED',
  TRASH = 'TRASH',
}

export enum TaskBehavior {
  RECURRING = 'RECURRING',
  ONE_OFF = 'ONE_OFF',
}

export enum CompletionPolicy {
  AUTO_DELETE = 'AUTO_DELETE',
  KEEP = 'KEEP',
  MOVE_TO_DONE = 'MOVE_TO_DONE',
}

export interface ToDoList {
  id: string | number;
  name: string;
  ownerId: number | string;
  order: number;
  type: ListType;
  taskBehavior: TaskBehavior;
  completionPolicy: CompletionPolicy;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tasks?: Task[];
}

export interface CreateToDoListDto {
  name: string;
  taskBehavior?: TaskBehavior;
  completionPolicy?: CompletionPolicy;
}

export interface UpdateToDoListDto {
  name?: string;
  taskBehavior?: TaskBehavior;
  completionPolicy?: CompletionPolicy;
}

// Task Types
export interface Task {
  id: number | string;
  description: string;
  completed: boolean;
  completedAt: string | null; // When the task was marked complete
  todoListId: number | string;
  originalListId?: number | string | null;
  order: number;
  dueDate: string | null;
  reminderDaysBefore: number[];
  specificDayOfWeek: number | null;
  reminderConfig?: unknown; // JSON field for storing reminder configurations
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  steps?: Step[];
  todoList?: ToDoList;
}

export interface CreateTaskDto {
  description: string;
  dueDate?: string;
  specificDayOfWeek?: number;
  reminderDaysBefore?: number[];
  reminderConfig?: unknown;
  completed?: boolean;
}

export interface UpdateTaskDto {
  description?: string;
  dueDate?: string | null;
  specificDayOfWeek?: number | null;
  reminderDaysBefore?: number[];
  reminderConfig?: unknown; // JSON field for storing reminder configurations
  completed?: boolean;
  order?: number;
}

// Step Types
export interface Step {
  id: number | string;
  description: string;
  completed: boolean;
  taskId: number | string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateStepDto {
  description: string;
  completed?: boolean;
}

export interface UpdateStepDto {
  description?: string;
  completed?: boolean;
}

export interface ReorderStepsDto {
  stepIds: number[];
}

// Reminder Types
export interface ReminderNotification {
  taskId: number;
  taskDescription: string;
  dueDate: string | null;
  reminderDate: string;
  reminderDaysBefore: number;
  message: string;
  title: string;
  listName: string;
  listType: string;
}

// List Sharing Types
export interface ShareListDto {
  sharedWithId: number;
}

export interface ListShare {
  id: number;
  sharedWithId: number;
  toDoListId: number;
  sharedWith?: User;
  toDoList?: ToDoList;
}

export interface TrashResponse {
  lists: ToDoList[];
  tasks: Task[];
}

export interface UpdateProfilePictureResponse {
  message: string;
  profilePicture: string;
}

// API Error Types
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}


