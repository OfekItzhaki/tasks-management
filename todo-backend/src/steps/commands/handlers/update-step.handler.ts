import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateStepCommand } from '../update-step.command';
import { EventsService } from '../../../events/events.service';

@CommandHandler(UpdateStepCommand)
export class UpdateStepHandler implements ICommandHandler<UpdateStepCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async execute(command: UpdateStepCommand) {
    const { stepId, dto, userId } = command;

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

    const updatedStep = await this.prisma.step.update({
      where: { id: stepId },
      data: {
        description: dto.description,
        completed: dto.completed,
      },
    });

    await this.eventsService.broadcastStepEvent(step.taskId, 'step_updated', {
      taskId: step.taskId,
      step: updatedStep,
    });

    return updatedStep;
  }
}
