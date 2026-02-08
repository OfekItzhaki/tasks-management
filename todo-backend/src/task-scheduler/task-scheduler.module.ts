import { Module } from '@nestjs/common';
import { TaskSchedulerService } from './task-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule, getQueueToken } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    ...(process.env.REDIS_HOST
      ? [
          BullModule.registerQueue({
            name: 'reminders',
          }),
        ]
      : []),
  ],
  providers: [
    TaskSchedulerService,
    ...(process.env.REDIS_HOST
      ? []
      : [
          {
            provide: getQueueToken('reminders'),
            useValue: {
              add: async () => {},
              process: async () => {},
            },
          },
        ]),
  ],
  exports: [TaskSchedulerService],
})
export class TaskSchedulerModule {}
