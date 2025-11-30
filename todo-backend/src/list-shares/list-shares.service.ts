import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ShareListDto } from './dto/share-list.dto';

@Injectable()
export class ListSharesService {
  constructor(private prisma: PrismaService) {}

  private async ensureOwnedList(todoListId: number, ownerId: number) {
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

  async shareList(
    todoListId: number,
    shareListDto: ShareListDto,
    ownerId: number,
  ) {
    // Verify list exists and user owns it
    await this.ensureOwnedList(todoListId, ownerId);

    // Verify user exists
    const user = await this.prisma.user.findFirst({
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
    const existingShare = await this.prisma.listShare.findUnique({
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
    return this.prisma.listShare.create({
      data: {
        sharedWithId: shareListDto.sharedWithId,
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
        toDoList: true,
      },
    });
  }

  async getSharedLists(userId: number) {
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

  async getListShares(todoListId: number, ownerId: number) {
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

  async unshareList(todoListId: number, userId: number, ownerId: number) {
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

    return this.prisma.listShare.delete({
      where: {
        id: share.id,
      },
    });
  }
}
