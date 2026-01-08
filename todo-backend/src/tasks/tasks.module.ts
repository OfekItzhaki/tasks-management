import { Module, forwardRef } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskSchedulerModule } from '../task-scheduler/task-scheduler.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TaskSchedulerModule)],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}

