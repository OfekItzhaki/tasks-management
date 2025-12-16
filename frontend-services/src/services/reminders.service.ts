import { apiClient } from '../utils/api-client';
import { ReminderNotification } from '../types';

export class RemindersService {
  /**
   * Get reminder notifications for today
   */
  async getToday(): Promise<ReminderNotification[]> {
    return apiClient.get<ReminderNotification[]>('/reminders/today');
  }

  /**
   * Get reminder notifications for a specific date
   */
  async getByDate(date: string): Promise<ReminderNotification[]> {
    return apiClient.get<ReminderNotification[]>(
      `/reminders/date?date=${date}`,
    );
  }

  /**
   * Get reminder notifications for a date range
   */
  async getByRange(
    startDate: string,
    endDate: string,
  ): Promise<ReminderNotification[]> {
    return apiClient.get<ReminderNotification[]>(
      `/reminders/range?startDate=${startDate}&endDate=${endDate}`,
    );
  }
}

export const remindersService = new RemindersService();


