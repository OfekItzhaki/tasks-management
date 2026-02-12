import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
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
    const list = await this.prisma.toDoList.findFirst({
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

  async shareList(todoListId: string, shareListDto: ShareListDto, ownerId: string) {
    // Verify list exists and user owns it
    await this.ensureOwnedList(todoListId, ownerId);

    // Verify user exists by email
    const user = await this.prisma.user.findFirst({
      where: {
        email: shareListDto.email,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${shareListDto.email} not found`);
    }

    if (user.id === ownerId) {
      throw new BadRequestException('You cannot share a list with yourself');
    }

    // Check if already shared
    const existingShare = await this.prisma.listShare.findUnique({
      where: {
        sharedWithId_toDoListId: {
          sharedWithId: user.id,
          toDoListId: todoListId,
        },
      },
    });

    if (existingShare) {
      throw new ConflictException('List is already shared with this user');
    }

    // Create share
    const share = await this.prisma.listShare.create({
      data: {
        sharedWithId: user.id,
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
    this.eventsGateway.sendToUser(user.id, 'list_shared', share.toDoList);

    return share;
  }

  async getSharedLists(userId: string) {
    // Get all lists shared with this user
    const shares = await this.prisma.listShare.findMany({
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
      .map((share) => share.toDoList)
      .filter((list) => list !== null && list.deletedAt === null);
  }

  async getListShares(todoListId: string, ownerId: string) {
    await this.ensureOwnedList(todoListId, ownerId);

    return this.prisma.listShare.findMany({
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
    const share = await this.prisma.listShare.findUnique({
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

    const result = await this.prisma.listShare.delete({
      where: {
        id: share.id,
      },
    });

    // Notify the unshared user
    this.eventsGateway.sendToUser(userId, 'list_unshared', { id: todoListId });

    return result;
  }

  async updateShareRole(todoListId: string, userId: string, role: ShareRole, ownerId: string) {
    await this.ensureOwnedList(todoListId, ownerId);

    const share = await this.prisma.listShare.findUnique({
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

    const updated = await this.prisma.listShare.update({
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
