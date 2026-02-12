import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PermanentDeleteTaskCommand } from '../permanent-delete-task.command';
import { TasksService } from '../../tasks.service';
import { EventsService } from '../../../events/events.service';

@CommandHandler(PermanentDeleteTaskCommand)
export class PermanentDeleteTaskHandler implements ICommandHandler<PermanentDeleteTaskCommand> {
  constructor(
    private readonly tasksService: TasksService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: PermanentDeleteTaskCommand) {
    const result = await this.tasksService.permanentDelete(command.id, command.userId);

    await this.eventsService.broadcastTaskEvent(command.id, 'task_permanently_deleted', {
      id: command.id,
    });

    return result;
  }
}
