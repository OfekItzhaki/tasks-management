import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStepCommand } from '../create-step.command';
import { EventsService } from '../../../events/events.service';

@CommandHandler(CreateStepCommand)
export class CreateStepHandler implements ICommandHandler<CreateStepCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: CreateStepCommand) {
    const { taskId, dto, userId } = command;

    // Ensure access to task
    const task = await (this.prisma.task as any).findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        todoList: {
          deletedAt: null,
          OR: [
            { ownerId: userId },
            { shares: { some: { sharedWithId: userId } } },
          ],
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Get next order
    const lastStep = await (this.prisma.step as any).findFirst({
      where: { taskId, deletedAt: null },
      orderBy: { order: 'desc' },
    });
    const order = lastStep ? lastStep.order + 1 : 1;

    const step = await (this.prisma.step as any).create({
      data: {
        description: dto.description,
        completed: dto.completed ?? false,
        taskId,
        order,
      },
    });

    await this.eventsService.broadcastStepEvent(taskId, 'step_created', {
      taskId,
      step,
    });

    return step;
  }
}
