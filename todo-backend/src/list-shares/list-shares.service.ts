import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShareListDto } from './dto/share-list.dto';
import { EventsGateway } from '../events/events.gateway';
import { ShareRole } from '@prisma/client';

@Injectable()
export class ListSharesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  private async ensureOwnedList(todoListId: string, ownerId: string) {
    const list = await (this.prisma.toDoList as any).findFirst({
      where: {
        id: todoListId,
        ownerId,
        deletedAt: null,
      },
    });

    if (!list) {
      throw new NotFoundException(`ToDoList with ID ${todoListId} not found`);
    }

    return list;
  }

  async shareList(
    todoListId: string,
    shareListDto: ShareListDto,
    ownerId: string,
  ) {
    // Verify list exists and user owns it
    await this.ensureOwnedList(todoListId, ownerId);

    // Verify user exists
    const user = await (this.prisma.user as any).findFirst({
      where: {
        id: shareListDto.sharedWithId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${shareListDto.sharedWithId} not found`,
      );
    }

    // Check if already shared
    const existingShare = await (this.prisma.listShare as any).findUnique({
      where: {
        sharedWithId_toDoListId: {
          sharedWithId: shareListDto.sharedWithId,
          toDoListId: todoListId,
        },
      },
    });

    if (existingShare) {
      throw new ConflictException('List is already shared with this user');
    }

    // Create share
    const share = await (this.prisma.listShare as any).create({
      data: {
        sharedWithId: shareListDto.sharedWithId,
        toDoListId: todoListId,
        role: shareListDto.role ?? ShareRole.EDITOR,
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
        toDoList: {
          include: {
            tasks: {
              where: { deletedAt: null },
              orderBy: { order: 'asc' },
              include: { steps: { where: { deletedAt: null } } },
            },
          },
        },
      },
    });

    // Notify the shared user
    this.eventsGateway.sendToUser(
      shareListDto.sharedWithId,
      'list_shared',
      share.toDoList,
    );

    return share;
  }

  async getSharedLists(userId: string) {
    // Get all lists shared with this user
    const shares = await (this.prisma.listShare as any).findMany({
      where: {
        sharedWithId: userId,
      },
      include: {
        toDoList: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
                profilePicture: true,
              },
            },
            tasks: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    // Filter out deleted lists and return only the list objects
    return shares
      .map((share: any) => share.toDoList)
      .filter((list: any) => list !== null && list.deletedAt === null);
  }

  async getListShares(todoListId: string, ownerId: string) {
    await this.ensureOwnedList(todoListId, ownerId);

    return (this.prisma.listShare as any).findMany({
      where: {
        toDoListId: todoListId,
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

  async unshareList(todoListId: string, userId: string, ownerId: string) {
    await this.ensureOwnedList(todoListId, ownerId);

    // Verify share exists
    const share = await (this.prisma.listShare as any).findUnique({
      where: {
        sharedWithId_toDoListId: {
          sharedWithId: userId,
          toDoListId: todoListId,
        },
      },
    });

    if (!share) {
      throw new NotFoundException('List share not found');
    }

    const result = await (this.prisma.listShare as any).delete({
      where: {
        id: share.id,
      },
    });

    // Notify the unshared user
    this.eventsGateway.sendToUser(userId, 'list_unshared', { id: todoListId });

    return result;
  }

  async updateShareRole(
    todoListId: string,
    userId: string,
    role: ShareRole,
    ownerId: string,
  ) {
    await this.ensureOwnedList(todoListId, ownerId);

    const share = await (this.prisma.listShare as any).findUnique({
      where: {
        sharedWithId_toDoListId: {
          sharedWithId: userId,
          toDoListId: todoListId,
        },
      },
    });

    if (!share) {
      throw new NotFoundException('List share not found');
    }

    const updated = await (this.prisma.listShare as any).update({
      where: { id: share.id },
      data: { role },
      include: {
        sharedWith: {
          select: { id: true, email: true, name: true, profilePicture: true },
        },
      },
    });

    // Notify the shared user about their new role
    this.eventsGateway.sendToUser(userId, 'share_role_updated', {
      todoListId,
      role,
    });

    return updated;
  }
}
