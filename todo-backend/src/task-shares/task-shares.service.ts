import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShareTaskDto } from './dto/share-task.dto';
import { EventsGateway } from '../events/events.gateway';
import { ShareRole } from '@prisma/client';
import { TaskAccessHelper } from '../tasks/helpers/task-access.helper';

@Injectable()
export class TaskSharesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private taskAccessHelper: TaskAccessHelper,
  ) {}

  async shareTask(taskId: string, shareTaskDto: ShareTaskDto, ownerId: string) {
    // Verify task exists and user owns it (or has editor access to the list)
    // For single task sharing, we strictly require the OWNER of the list to share it for now,
    // or we can allow editors. Let's start with owner/editor access to the parent list.
    await this.taskAccessHelper.findTaskForUser(taskId, ownerId, ShareRole.EDITOR);

    // Verify user exists by email
    const user = await this.prisma.user.findFirst({
      where: {
        email: shareTaskDto.email,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${shareTaskDto.email} not found`);
    }

    if (user.id === ownerId) {
      throw new BadRequestException('You cannot share a task with yourself');
    }

    // Check if already shared at task level
    const existingShare = await this.prisma.taskShare.findUnique({
      where: {
        sharedWithId_taskId: {
          sharedWithId: user.id,
          taskId: taskId,
        },
      },
    });

    if (existingShare) {
      throw new ConflictException('Task is already shared with this user');
    }

    // Create share
    const share = await this.prisma.taskShare.create({
      data: {
        sharedWithId: user.id,
        taskId: taskId,
        role: shareTaskDto.role ?? ShareRole.EDITOR,
      },
      include: {
        sharedWith: {
          select: {
            id: true,
            email: true,
            name: true,
            profilePicture: true,
          },
        },
        task: {
          include: {
            steps: { where: { deletedAt: null } },
            todoList: true,
          },
        },
      },
    });

    // Notify the shared user
    this.eventsGateway.sendToUser(user.id, 'task_shared', share.task);

    return share;
  }

  async getTaskShares(taskId: string, userId: string) {
    // Verify access to the task
    await this.taskAccessHelper.findTaskForUser(taskId, userId, ShareRole.VIEWER);

    return this.prisma.taskShare.findMany({
      where: {
        taskId: taskId,
      },
      include: {
        sharedWith: {
          select: {
            id: true,
            email: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async unshareTask(taskId: string, sharedWithId: string, ownerId: string) {
    // Verify sharing person has editor access to the task
    await this.taskAccessHelper.findTaskForUser(taskId, ownerId, ShareRole.EDITOR);

    // Verify share exists
    const share = await this.prisma.taskShare.findUnique({
      where: {
        sharedWithId_taskId: {
          sharedWithId: sharedWithId,
          taskId: taskId,
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Task share not found');
    }

    const result = await this.prisma.taskShare.delete({
      where: {
        id: share.id,
      },
    });

    // Notify the unshared user
    this.eventsGateway.sendToUser(sharedWithId, 'task_unshared', { id: taskId });

    return result;
  }

  async updateShareRole(taskId: string, sharedWithId: string, role: ShareRole, ownerId: string) {
    // Verify sharing person has editor access
    await this.taskAccessHelper.findTaskForUser(taskId, ownerId, ShareRole.EDITOR);

    const share = await this.prisma.taskShare.findUnique({
      where: {
        sharedWithId_taskId: {
          sharedWithId: sharedWithId,
          taskId: taskId,
        },
      },
    });

    if (!share) {
      throw new NotFoundException('Task share not found');
    }

    const updated = await this.prisma.taskShare.update({
      where: { id: share.id },
      data: { role },
      include: {
        sharedWith: {
          select: { id: true, email: true, name: true, profilePicture: true },
        },
      },
    });

    // Notify the shared user about their new role
    this.eventsGateway.sendToUser(sharedWithId, 'task_share_role_updated', {
      taskId,
      role,
    });

    return updated;
  }

  async getTasksSharedWithMe(userId: string) {
    return this.prisma.taskShare.findMany({
      where: {
        sharedWithId: userId,
        task: {
          deletedAt: null,
        },
      },
      include: {
        task: {
          include: {
            steps: { where: { deletedAt: null } },
            todoList: true,
          },
        },
      },
    });
  }
}
