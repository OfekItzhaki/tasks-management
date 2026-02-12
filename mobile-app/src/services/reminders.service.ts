import { apiClient, ApiError } from '../utils/api-client';
import { ReminderNotification } from '../types';

export class RemindersService {
  /**
   * Get reminder notifications for today
   */
  async getToday(): Promise<ReminderNotification[]> {
    try {
      const response = await apiClient.get<ReminderNotification[]>('/reminders/today');
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, "Failed to fetch today's reminders");
    }
  }

  /**
   * Get reminder notifications for a specific date
   */
  async getByDate(date: string): Promise<ReminderNotification[]> {
    try {
      const response = await apiClient.get<ReminderNotification[]>('/reminders/date', {
        params: { date },
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to fetch reminders by date');
    }
  }

  /**
   * Get reminder notifications for a date range
   */
  async getByRange(startDate: string, endDate: string): Promise<ReminderNotification[]> {
    try {
      const response = await apiClient.get<ReminderNotification[]>('/reminders/range', {
        params: { startDate, endDate },
      });
      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Failed to fetch reminders by range');
    }
  }
}

export const remindersService = new RemindersService();
