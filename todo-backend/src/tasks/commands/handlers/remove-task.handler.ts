import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveTaskCommand } from '../remove-task.command';
import { TasksService } from '../../tasks.service';
import { EventsService } from '../../../events/events.service';

@CommandHandler(RemoveTaskCommand)
export class RemoveTaskHandler implements ICommandHandler<RemoveTaskCommand> {
  constructor(
    private readonly tasksService: TasksService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: RemoveTaskCommand) {
    const result = await this.tasksService.remove(command.id, command.userId);

    await this.eventsService.broadcastTaskEvent(command.id, 'task_deleted', {
      id: command.id,
    });

    return result;
  }
}
