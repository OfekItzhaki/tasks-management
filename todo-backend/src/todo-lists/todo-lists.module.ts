import { Module } from '@nestjs/common';
import { TodoListsController } from './todo-lists.controller';
import { TodoListsService } from './todo-lists.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';
import { CreateTodoListHandler } from './commands/handlers/create-todo-list.handler';
import { UpdateTodoListHandler } from './commands/handlers/update-todo-list.handler';
import { RemoveTodoListHandler } from './commands/handlers/remove-todo-list.handler';
import { RestoreTodoListHandler } from './commands/handlers/restore-todo-list.handler';
import { PermanentDeleteTodoListHandler } from './commands/handlers/permanent-delete-todo-list.handler';
import { GetTodoListsHandler } from './queries/handlers/get-todo-lists.handler';
import { GetTodoListByIdHandler } from './queries/handlers/get-todo-list-by-id.handler';

const CommandHandlers = [
  CreateTodoListHandler,
  UpdateTodoListHandler,
  RemoveTodoListHandler,
  RestoreTodoListHandler,
  PermanentDeleteTodoListHandler,
];
const QueryHandlers = [GetTodoListsHandler, GetTodoListByIdHandler];

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [TodoListsController],
  providers: [TodoListsService, ...CommandHandlers, ...QueryHandlers],
  exports: [TodoListsService],
})
export class TodoListsModule {}
