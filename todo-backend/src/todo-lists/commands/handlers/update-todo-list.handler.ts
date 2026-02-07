import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateTodoListCommand } from '../update-todo-list.command';
import { TodoListsService } from '../../todo-lists.service';
import { EventsService } from '../../../events/events.service';

@CommandHandler(UpdateTodoListCommand)
export class UpdateTodoListHandler
  implements ICommandHandler<UpdateTodoListCommand>
{
  constructor(
    private readonly todoListsService: TodoListsService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: UpdateTodoListCommand) {
    const result = await this.todoListsService.update(
      command.id,
      command.updateToDoListDto,
      command.userId,
    );

    await this.eventsService.broadcastListEvent(
      command.id,
      'list_updated',
      result,
    );

    return result;
  }
}
