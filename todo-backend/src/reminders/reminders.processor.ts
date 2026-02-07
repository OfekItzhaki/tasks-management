import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { RemindersService } from './reminders.service';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ReminderJobData {
  userId?: string;
}

@Processor('reminders')
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(
    private readonly remindersService: RemindersService,
    private readonly prisma: PrismaService,
    @InjectQueue('reminders') private readonly remindersQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<ReminderJobData, any, string>): Promise<any> {
    switch (job.name) {
      case 'processAllReminders':
        return this.handleProcessAllReminders();
      case 'processUserReminders':
        if (!job.data.userId) throw new Error('Missing userId in job data');
        return this.handleProcessUserReminders(job.data.userId);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleProcessAllReminders() {
    this.logger.log('Processing reminders for all users');
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    for (const user of users) {
      await this.remindersQueue.add('processUserReminders', {
        userId: user.id,
      });
    }
  }

  private async handleProcessUserReminders(userId: string) {
    this.logger.log(`Processing reminders for user: ${userId}`);
    const notifications = await this.remindersService.getTodayReminders(userId);

    if (notifications.length > 0) {
      this.logger.log(
        `Found ${notifications.length} reminders for user ${userId}`,
      );
      // The logic for sending these (Socket/Email) should live in RemindersService
      // or we can handle it here if we want to keep service pure.
      // Given the "Premium" vision, we'll implement a push method in RemindersService.
      await this.remindersService.sendReminders(userId, notifications);
    }
  }
}
