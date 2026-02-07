import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskAccessHelper } from '../tasks/helpers/task-access.helper';
import { ShareRole } from '@prisma/client';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';

@Injectable()
export class StepsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskAccess: TaskAccessHelper,
  ) {}

  private async ensureTaskAccess(taskId: string, userId: string) {
    // Check if user owns the list OR has shared access
    const task = await this.prisma.task.findFirst({
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

    return task;
  }

  private async ensureStepAccess(stepId: string, userId: string) {
    // Check if user owns the list OR has shared access
    const step = await this.prisma.step.findFirst({
      where: {
        id: stepId,
        deletedAt: null,
        task: {
          deletedAt: null,
          todoList: {
            deletedAt: null,
            OR: [
              { ownerId: userId },
              { shares: { some: { sharedWithId: userId } } },
            ],
          },
        },
      },
      include: {
        task: true,
      },
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${stepId} not found`);
    }

    return step;
  }

  private async getNextOrder(taskId: string) {
    const lastStep = await this.prisma.step.findFirst({
      where: { taskId, deletedAt: null },
      orderBy: { order: 'desc' },
    });

    return lastStep ? lastStep.order + 1 : 1;
  }

  async create(taskId: string, dto: CreateStepDto, ownerId: string) {
    await this.taskAccess.findTaskForUser(taskId, ownerId, ShareRole.EDITOR);
    const order = await this.getNextOrder(taskId);

    return this.prisma.step.create({
      data: {
        description: dto.description,
        completed: dto.completed ?? false,
        taskId,
        order,
      },
    });
  }

  async findAll(taskId: string, ownerId: string) {
    await this.taskAccess.findTaskForUser(taskId, ownerId);

    return this.prisma.step.findMany({
      where: {
        taskId,
        deletedAt: null,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async update(stepId: string, dto: UpdateStepDto, ownerId: string) {
    const step = await this.ensureStepAccess(stepId, ownerId);
    // Find task to check EDITOR role
    await this.taskAccess.findTaskForUser(
      step.taskId,
      ownerId,
      ShareRole.EDITOR,
    );

    return this.prisma.step.update({
      where: { id: stepId },
      data: {
        description: dto.description,
        completed: dto.completed,
      },
    });
  }

  async remove(stepId: string, ownerId: string) {
    const step = await this.ensureStepAccess(stepId, ownerId);
    await this.taskAccess.findTaskForUser(
      step.taskId,
      ownerId,
      ShareRole.EDITOR,
    );

    return this.prisma.step.update({
      where: { id: stepId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async reorder(taskId: string, ownerId: string, stepIds: string[]) {
    await this.taskAccess.findTaskForUser(taskId, ownerId, ShareRole.EDITOR);

    const existingSteps = await this.prisma.step.findMany({
      where: {
        taskId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (existingSteps.length !== stepIds.length) {
      throw new BadRequestException(
        'All steps must be included when reordering',
      );
    }

    // Check for duplicate step IDs
    const uniqueStepIds = new Set(stepIds);
    if (uniqueStepIds.size !== stepIds.length) {
      throw new BadRequestException(
        'Duplicate step IDs are not allowed when reordering',
      );
    }

    const validStepIds = new Set(existingSteps.map((step) => step.id));
    stepIds.forEach((id) => {
      if (!validStepIds.has(id)) {
        throw new BadRequestException(
          `Step ID ${id} does not belong to task ${taskId}`,
        );
      }
    });

    const updates = stepIds.map((stepId, index) =>
      this.prisma.step.update({
        where: { id: stepId },
        data: { order: index + 1 },
      }),
    );

    await this.prisma.$transaction(updates);
    return this.findAll(taskId, ownerId);
  }
}
