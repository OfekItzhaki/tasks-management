import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RestoreTaskCommand } from '../restore-task.command';
import { TasksService } from '../../tasks.service';
import { EventsService } from '../../../events/events.service';

@CommandHandler(RestoreTaskCommand)
export class RestoreTaskHandler implements ICommandHandler<RestoreTaskCommand> {
  constructor(
    private readonly tasksService: TasksService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: RestoreTaskCommand) {
    const result = await this.tasksService.restore(command.id, command.userId);

    await this.eventsService.broadcastTaskEvent(command.id, 'task_restored', result);

    return result;
  }
}
