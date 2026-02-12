import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ListType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TaskAccessHelper } from '../tasks/helpers/task-access.helper';
import { ShareRole } from '@prisma/client';
import { CreateToDoListDto } from './dto/create-todo-list.dto';
import { UpdateToDoListDto } from './dto/update-todo-list.dto';

@Injectable()
export class TodoListsService {
  private readonly logger = new Logger(TodoListsService.name);

  constructor(
    private prisma: PrismaService,
    private taskAccess: TaskAccessHelper,
  ) {}

  async create(createToDoListDto: CreateToDoListDto, ownerId: string) {
    const list = await this.prisma.toDoList.create({
      data: {
        name: createToDoListDto.name,
        type: ListType.CUSTOM,
        ownerId,
        taskBehavior: createToDoListDto.taskBehavior ?? 'ONE_OFF',
        completionPolicy: createToDoListDto.completionPolicy ?? 'KEEP',
      },
    });
    this.logger.log(`List created: listId=${list.id} userId=${ownerId}`);
    return list;
  }

  async seedDefaultLists(userId: string) {
    const defaultLists: {
      name: string;
      type: ListType;
      taskBehavior: 'RECURRING' | 'ONE_OFF';
      completionPolicy: 'KEEP' | 'AUTO_DELETE' | 'MOVE_TO_DONE';
      isSystem?: boolean;
    }[] = [
      {
        name: 'Daily Tasks',
        type: ListType.DAILY,
        taskBehavior: 'RECURRING',
        completionPolicy: 'KEEP',
      },
      {
        name: 'Weekly Tasks',
        type: ListType.WEEKLY,
        taskBehavior: 'RECURRING',
        completionPolicy: 'KEEP',
      },
      {
        name: 'Monthly Tasks',
        type: ListType.MONTHLY,
        taskBehavior: 'RECURRING',
        completionPolicy: 'KEEP',
      },
      {
        name: 'Yearly Tasks',
        type: ListType.YEARLY,
        taskBehavior: 'RECURRING',
        completionPolicy: 'KEEP',
      },
      {
        name: 'Hot Tasks',
        type: ListType.CUSTOM,
        taskBehavior: 'ONE_OFF',
        completionPolicy: 'MOVE_TO_DONE',
      },
      {
        name: 'Done',
        type: ListType.FINISHED,
        taskBehavior: 'ONE_OFF',
        completionPolicy: 'KEEP',
        isSystem: true,
      },
      {
        name: 'Trash',
        type: ListType.TRASH,
        taskBehavior: 'ONE_OFF',
        completionPolicy: 'KEEP',
        isSystem: true,
      },
    ];

    for (const dl of defaultLists) {
      const list = await this.prisma.toDoList.create({
        data: {
          name: dl.name,
          type: dl.type,
          ownerId: userId,
          taskBehavior: dl.taskBehavior,
          completionPolicy: dl.completionPolicy,
          isSystem: dl.isSystem || false,
        },
      });

      // Add 4 default tasks to each list except Trash
      if (dl.type !== ListType.TRASH) {
        for (let i = 1; i <= 4; i++) {
          await this.prisma.task.create({
            data: {
              description: `Example ${dl.name} Task ${i}`,
              todoListId: list.id,
              order: i,
            },
          });
        }
      }
    }
    this.logger.log(`Default lists seeded for userId=${userId}`);
  }

  async findAll(ownerId: string) {
    // Lazy Seeding: Ensure system lists exist for this user
    const systemLists = await this.prisma.toDoList.findMany({
      where: {
        ownerId,
        type: { in: [ListType.TRASH, ListType.FINISHED] },
        deletedAt: null,
      },
    });

    const hasTrash = systemLists.some((l) => l.type === ListType.TRASH);
    const hasDone = systemLists.some((l) => l.type === ListType.FINISHED);

    if (!hasTrash || !hasDone) {
      if (!hasTrash) {
        await this.prisma.toDoList.create({
          data: {
            name: 'Trash', // Localize? Backend usually English or key
            type: ListType.TRASH,
            ownerId,
            taskBehavior: 'ONE_OFF',
            completionPolicy: 'KEEP',
            isSystem: true,
          },
        });
        this.logger.log(`Lazy seeded Trash list for userId=${ownerId}`);
      }
      if (!hasDone) {
        await this.prisma.toDoList.create({
          data: {
            name: 'Done',
            type: ListType.FINISHED,
            ownerId,
            taskBehavior: 'ONE_OFF',
            completionPolicy: 'KEEP',
            isSystem: true,
          },
        });
        this.logger.log(`Lazy seeded Done list for userId=${ownerId}`);
      }
    }

    return this.prisma.toDoList.findMany({
      where: {
        deletedAt: null,
        ownerId,
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    await this.taskAccess.ensureListAccess(id, userId);

    const list = await this.prisma.toDoList.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        tasks: {
          where: {
            deletedAt: null,
          },
          include: {
            steps: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!list) {
      throw new NotFoundException(`ToDoList with ID ${id} not found`);
    }

    return list;
  }

  async update(id: string, updateToDoListDto: UpdateToDoListDto, userId: string) {
    const list = await this.taskAccess.ensureListAccess(id, userId, ShareRole.EDITOR);

    const updated = await this.prisma.toDoList.update({
      where: { id },
      data: {
        name: updateToDoListDto.name ?? list.name,
        taskBehavior: updateToDoListDto.taskBehavior ?? list.taskBehavior,
        completionPolicy: updateToDoListDto.completionPolicy ?? list.completionPolicy,
      },
    });
    this.logger.log(`List updated: listId=${id} userId=${userId}`);
    return updated;
  }

  async remove(id: string, ownerId: string) {
    const list = await this.findOne(id, ownerId);

    // Prevent deletion of system lists (like "Finished Tasks")
    if (list.isSystem) {
      throw new Error('System lists cannot be deleted');
    }

    const result = await this.prisma.toDoList.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
    this.logger.log(`List removed (soft): listId=${id} userId=${ownerId}`);
    return result;
  }

  async restore(id: string, ownerId: string) {
    const list = await this.prisma.toDoList.findFirst({
      where: { id, ownerId, deletedAt: { not: null } },
    });
    if (!list) {
      throw new NotFoundException(`Deleted ToDoList with ID ${id} not found`);
    }

    const result = await this.prisma.toDoList.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
    this.logger.log(`List restored: listId=${id} userId=${ownerId}`);
    return result;
  }

  async permanentDelete(id: string, ownerId: string) {
    const list = await this.prisma.toDoList.findFirst({
      where: { id, ownerId, deletedAt: { not: null } },
    });
    if (!list) {
      throw new NotFoundException(`Deleted ToDoList with ID ${id} not found`);
    }

    // Manual cleanup of relations if not cascading
    await this.prisma.step.deleteMany({
      where: { task: { todoListId: id } },
    });
    await this.prisma.task.deleteMany({ where: { todoListId: id } });
    await this.prisma.listShare.deleteMany({
      where: { toDoListId: id },
    });

    const result = await this.prisma.toDoList.delete({
      where: { id },
    });
    this.logger.log(`List permanently deleted: listId=${id} userId=${ownerId}`);
    return result;
  }
}
