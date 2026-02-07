import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateTodoListCommand } from '../create-todo-list.command';
import { TodoListsService } from '../../todo-lists.service';
import { EventsService } from '../../../events/events.service';

@CommandHandler(CreateTodoListCommand)
export class CreateTodoListHandler
  implements ICommandHandler<CreateTodoListCommand>
{
  constructor(
    private readonly todoListsService: TodoListsService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: CreateTodoListCommand) {
    const result = await this.todoListsService.create(
      command.createToDoListDto,
      command.userId,
    );

    await this.eventsService.broadcastListEvent(
      result.id,
      'list_created',
      result,
    );

    return result;
  }
}
