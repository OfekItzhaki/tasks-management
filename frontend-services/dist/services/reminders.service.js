import { apiClient } from '../utils/api-client';
export class RemindersService {
    /**
     * Get reminder notifications for today
     */
    async getToday() {
        return apiClient.get('/reminders/today');
    }
    /**
     * Get reminder notifications for a specific date
     */
    async getByDate(date) {
        const encodedDate = encodeURIComponent(date);
        return apiClient.get(`/reminders/date?date=${encodedDate}`);
    }
    /**
     * Get reminder notifications for a date range
     */
    async getByRange(startDate, endDate) {
        const encodedStartDate = encodeURIComponent(startDate);
        const encodedEndDate = encodeURIComponent(endDate);
        return apiClient.get(`/reminders/range?startDate=${encodedStartDate}&endDate=${encodedEndDate}`);
    }
}
export const remindersService = new RemindersService();
