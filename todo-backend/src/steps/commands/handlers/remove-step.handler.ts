import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RemoveStepCommand } from '../remove-step.command';
import { EventsService } from '../../../events/events.service';

@CommandHandler(RemoveStepCommand)
export class RemoveStepHandler implements ICommandHandler<RemoveStepCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: RemoveStepCommand) {
    const { stepId, userId } = command;

    const step = await this.prisma.step.findFirst({
      where: {
        id: stepId,
        deletedAt: null,
        task: {
          deletedAt: null,
          todoList: {
            deletedAt: null,
            OR: [{ ownerId: userId }, { shares: { some: { sharedWithId: userId } } }],
          },
        },
      },
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${stepId} not found`);
    }

    const result = await this.prisma.step.update({
      where: { id: stepId },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.eventsService.broadcastStepEvent(step.taskId, 'step_deleted', {
      taskId: step.taskId,
      stepId,
    });

    return result;
  }
}
