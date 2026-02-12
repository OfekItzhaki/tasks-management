import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveTodoListCommand } from '../remove-todo-list.command';
import { TodoListsService } from '../../todo-lists.service';
import { EventsService } from '../../../events/events.service';

@CommandHandler(RemoveTodoListCommand)
export class RemoveTodoListHandler implements ICommandHandler<RemoveTodoListCommand> {
  constructor(
    private readonly todoListsService: TodoListsService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: RemoveTodoListCommand) {
    const result = await this.todoListsService.remove(command.id, command.userId);

    await this.eventsService.broadcastListEvent(command.id, 'list_deleted', {
      id: command.id,
    });

    return result;
  }
}
