import { Module } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { TasksModule } from '../tasks/tasks.module';
import { BullModule } from '@nestjs/bullmq';
import { RemindersProcessor } from './reminders.processor';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    TasksModule,
    EmailModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'reminders',
    }),
  ],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
  exports: [RemindersService],
})
export class RemindersModule { }
