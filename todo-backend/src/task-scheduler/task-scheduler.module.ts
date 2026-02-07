import { Module } from '@nestjs/common';
import { TaskSchedulerService } from './task-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'reminders',
    }),
  ],
  providers: [TaskSchedulerService],
  exports: [TaskSchedulerService],
})
export class TaskSchedulerModule {}
