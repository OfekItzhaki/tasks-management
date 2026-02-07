import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShareRole } from '@prisma/client';

@Injectable()
export class TaskAccessHelper {
  constructor(private readonly prisma: PrismaService) {}

  async ensureListAccess(
    todoListId: string,
    userId: string,
    requiredRole: ShareRole = ShareRole.VIEWER,
  ) {
    const list = await this.prisma.toDoList.findFirst({
      where: {
        id: todoListId,
        deletedAt: null,
      },
      include: {
        shares: {
          where: { sharedWithId: userId },
        },
      },
    });

    if (!list) {
      throw new NotFoundException(`ToDoList with ID ${todoListId} not found`);
    }

    // Owner always has access
    if (list.ownerId === userId) {
      return list;
    }

    const share = list.shares[0];
    if (!share) {
      throw new ForbiddenException('You do not have access to this list');
    }

    // RBAC: EDITOR can do everything a VIEWER can.
    // If required is VIEWER, both VIEWER and EDITOR are fine.
    // If required is EDITOR, only EDITOR is fine.
    if (requiredRole === ShareRole.EDITOR && share.role !== ShareRole.EDITOR) {
      throw new ForbiddenException(
        'You need Editor permissions for this action',
      );
    }

    return list;
  }

  async findTaskForUser(
    id: string,
    userId: string,
    requiredRole: ShareRole = ShareRole.VIEWER,
  ) {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        steps: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
        todoList: {
          include: {
            shares: {
              where: { sharedWithId: userId },
            },
          },
        },
      },
    });

    if (!task) {
      const existsButDeleted = await this.prisma.task.findUnique({
        where: { id },
      });
      if (existsButDeleted) {
        // Find it anyway for recovery purposes if it's the owner or has access to the list
        // However, for regular "findTaskForUser" we strictly check deletedAt: null
        // findById/restore will use separate logic if needed or we could add a flag.
      }
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Owner check
    if (task.todoList.ownerId === userId) {
      return task;
    }

    const share = task.todoList.shares[0];
    if (!share) {
      throw new ForbiddenException('You do not have access to this task');
    }

    if (requiredRole === ShareRole.EDITOR && share.role !== ShareRole.EDITOR) {
      throw new ForbiddenException(
        'You need Editor permissions for this action',
      );
    }

    return task;
  }
}
