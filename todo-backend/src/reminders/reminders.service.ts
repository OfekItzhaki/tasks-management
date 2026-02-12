import { Injectable, Logger } from '@nestjs/common';
import { TasksService } from '../tasks/tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { EmailService } from '../email/email.service';

export interface ReminderNotification {
  taskId: string;
  taskDescription: string;
  dueDate: Date | null;
  reminderDate: Date;
  reminderDaysBefore: number; // Which reminder this is (7 days, 1 day, etc.)
  message: string;
  title: string;
  listName: string;
  listType: string;
}

type TaskWithList = {
  id: string;
  description: string;
  dueDate: Date | string | null;
  specificDayOfWeek: number | null;
  reminderDaysBefore: number[] | number | null | undefined;
  todoList: { name: string; type: string };
};

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get reminders for a specific date and format them as notifications
   */
  async getReminderNotifications(
    ownerId: string,
    date: Date = new Date(),
  ): Promise<ReminderNotification[]> {
    const tasksWithReminders = await this.tasksService.getTasksWithReminders(ownerId, date);

    const notifications: ReminderNotification[] = [];

    (tasksWithReminders as TaskWithList[]).forEach((task) => {
      const reminderDaysArray = Array.isArray(task.reminderDaysBefore)
        ? task.reminderDaysBefore
        : task.reminderDaysBefore
          ? [task.reminderDaysBefore]
          : [1];

      const dueDate = this.calculateTaskDueDate(task, date);

      reminderDaysArray.forEach((reminderDays) => {
        const reminderTargetDate = new Date(dueDate!);
        reminderTargetDate.setDate(reminderTargetDate.getDate() - reminderDays);
        reminderTargetDate.setHours(0, 0, 0, 0);

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        if (reminderTargetDate.getTime() === targetDate.getTime()) {
          notifications.push({
            taskId: task.id,
            taskDescription: task.description,
            dueDate,
            reminderDate: new Date(date),
            reminderDaysBefore: reminderDays,
            message: this.formatReminderMessage(task, dueDate),
            title: this.formatReminderTitle(task),
            listName: task.todoList.name,
            listType: task.todoList.type,
          });
        }
      });
    });

    return notifications;
  }

  /**
   * Get reminders for today
   */
  async getTodayReminders(ownerId: string): Promise<ReminderNotification[]> {
    return this.getReminderNotifications(ownerId, new Date());
  }

  /**
   * Send reminders to user via multi-channel
   */
  async sendReminders(userId: string, notifications: ReminderNotification[]): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, notificationFrequency: true },
    });

    if (!user) return;

    for (const notification of notifications) {
      // 1. Push via WebSocket (Real-time)
      this.eventsGateway.sendToUser(userId, 'task-reminder', notification);

      // 2. Fallback to email if user has notifications enabled
      // Note: We could be more granular here based on user preferences
      if (user.notificationFrequency !== 'NONE') {
        await this.emailService.sendReminderEmail(
          user.email,
          notification.taskDescription,
          notification.message,
          notification.title,
        );
      }
    }
  }

  /**
   * Get reminders for a date range
   */
  async getRemindersForDateRange(
    ownerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReminderNotification[]> {
    const allReminders: ReminderNotification[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const reminders = await this.getReminderNotifications(ownerId, new Date(currentDate));
      allReminders.push(...reminders);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const uniqueReminders = new Map<string, ReminderNotification>();
    allReminders.forEach((reminder) => {
      if (!uniqueReminders.has(reminder.taskId)) {
        uniqueReminders.set(reminder.taskId, reminder);
      }
    });

    return Array.from(uniqueReminders.values());
  }

  private calculateTaskDueDate(task: TaskWithList, currentDate: Date): Date | null {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate;
    }

    if (task.specificDayOfWeek !== null) {
      const daysUntil = (task.specificDayOfWeek - currentDate.getDay() + 7) % 7;
      const dueDate = new Date(currentDate);
      dueDate.setDate(dueDate.getDate() + (daysUntil || 7));
      dueDate.setHours(0, 0, 0, 0);
      return dueDate;
    }

    const list = task.todoList;
    switch (list.type) {
      case 'WEEKLY': {
        const daysUntilSunday = (7 - currentDate.getDay()) % 7 || 7;
        const weeklyDue = new Date(currentDate);
        weeklyDue.setDate(weeklyDue.getDate() + daysUntilSunday);
        weeklyDue.setHours(0, 0, 0, 0);
        return weeklyDue;
      }
      case 'MONTHLY': {
        const monthlyDue = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        monthlyDue.setHours(0, 0, 0, 0);
        return monthlyDue;
      }
      case 'YEARLY': {
        const yearlyDue = new Date(currentDate.getFullYear() + 1, 0, 1);
        yearlyDue.setHours(0, 0, 0, 0);
        return yearlyDue;
      }
      default:
        return null;
    }
  }

  private formatReminderTitle(task: TaskWithList): string {
    return `Reminder: ${task.description}`;
  }

  private formatReminderMessage(task: TaskWithList, dueDate: Date | null): string {
    const listName = task.todoList.name;
    const taskDesc = task.description;

    if (dueDate) {
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilDue === 0) {
        return `"${taskDesc}" from ${listName} is due today!`;
      } else if (daysUntilDue === 1) {
        return `"${taskDesc}" from ${listName} is due tomorrow.`;
      } else {
        return `"${taskDesc}" from ${listName} is due in ${daysUntilDue} days.`;
      }
    }

    return `Reminder: "${taskDesc}" from ${listName}`;
  }
}
