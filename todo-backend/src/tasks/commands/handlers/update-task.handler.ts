import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateTaskCommand } from '../update-task.command';
import { TasksService } from '../../tasks.service';
import { EventsService } from '../../../events/events.service';

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  constructor(
    private readonly tasksService: TasksService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: UpdateTaskCommand) {
    const result = await this.tasksService.update(
      command.id,
      command.updateTaskDto,
      command.userId,
    );

    // Broadcast update to all authorized users (owner + shared)
    await this.eventsService.broadcastTaskEvent(command.id, 'task_updated', result);

    return result;
  }
}
