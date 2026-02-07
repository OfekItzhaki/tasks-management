import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateTaskCommand } from '../create-task.command';
import { TasksService } from '../../tasks.service';
import { EventsService } from '../../../events/events.service';

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(
    private readonly tasksService: TasksService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: CreateTaskCommand) {
    const result = await this.tasksService.create(
      command.todoListId,
      command.createTaskDto,
      command.userId,
    );

    await this.eventsService.broadcastTaskEvent(
      (result as any).id,
      'task_created',
      result,
    );

    return result;
  }
}
