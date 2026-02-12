import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { TasksModule } from '../tasks/tasks.module';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { RemindersProcessor } from './reminders.processor';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    TasksModule,
    EmailModule,
    PrismaModule,
    ...(process.env.REDIS_HOST
      ? [
          BullModule.registerQueue({
            name: 'reminders',
          }),
        ]
      : []),
  ],
  controllers: [RemindersController],
  providers: [
    RemindersService,
    RemindersProcessor,
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
  exports: [RemindersService],
})
export class RemindersModule {}
