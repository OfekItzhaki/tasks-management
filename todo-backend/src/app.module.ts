import { Module } from '@nestjs/common';
import AppService from './app.service';
import AppController from './app.controller';
import { TodoListsController } from './todo-lists/todo-lists.controller';
import { TodoListsService } from './todo-lists/todo-lists.service';
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';
import { ListSharesController } from './list-shares/list-shares.controller';
import { ListSharesService } from './list-shares/list-shares.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { StepsController } from './steps/steps.controller';
import { StepsService } from './steps/steps.service';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  controllers: [
    AppController,
    TodoListsController,
    TasksController,
    ListSharesController,
    StepsController,
  ],
  providers: [
    AppService,
    TodoListsService,
    TasksService,
    ListSharesService,
    StepsService,
  ],
})
export class AppModule {}
