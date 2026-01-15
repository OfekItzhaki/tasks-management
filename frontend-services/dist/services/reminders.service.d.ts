import { ReminderNotification } from '../types';
export declare class RemindersService {
    /**
     * Get reminder notifications for today
     */
    getToday(): Promise<ReminderNotification[]>;
    /**
     * Get reminder notifications for a specific date
     */
    getByDate(date: string): Promise<ReminderNotification[]>;
    /**
     * Get reminder notifications for a date range
     */
    getByRange(startDate: string, endDate: string): Promise<ReminderNotification[]>;
}
export declare const remindersService: RemindersService;
