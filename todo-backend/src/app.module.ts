import { Module } from '@nestjs/common';
import AppService from './app.service';
import AppController from './app.controller';
import UsersController from './users.controller';
import { PrismaService } from './prisma.service';
import { TodoListsController } from './todo-lists.controller';
import { TodoListsService } from './todo-lists.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import UsersService from './users.service';
import { ListSharesController } from './list-shares.controller';
import { ListSharesService } from './list-shares.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    UsersController,
    TodoListsController,
    TasksController,
    ListSharesController,
  ],
  providers: [
    AppService,
    PrismaService,
    UsersService,
    TodoListsService,
    TasksService,
    ListSharesService,
  ],
})
export class AppModule {}
