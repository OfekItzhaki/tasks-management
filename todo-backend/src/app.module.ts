import { Module } from '@nestjs/common';
import AppService from './app.service';
import AppController from './app.controller';
import { TodoListsController } from './todo-lists.controller';
import { TodoListsService } from './todo-lists.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ListSharesController } from './list-shares.controller';
import { ListSharesService } from './list-shares.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  controllers: [
    AppController,
    TodoListsController,
    TasksController,
    ListSharesController,
  ],
  providers: [
    AppService,
    TodoListsService,
    TasksService,
    ListSharesService,
  ],
})
export class AppModule {}
