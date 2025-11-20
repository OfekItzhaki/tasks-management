import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateToDoListDto } from './dto/create-todo-list.dto';
import { UpdateToDoListDto } from './dto/update-todo-list.dto';
import { ListType } from './dto/create-todo-list.dto';

@Injectable()
export class TodoListsService {
  constructor(private prisma: PrismaService) {}

  async create(createToDoListDto: CreateToDoListDto) {
    return this.prisma.toDoList.create({
      data: {
        name: createToDoListDto.name,
        type: createToDoListDto.type || ListType.CUSTOM,
        ownerId: createToDoListDto.ownerId || 1, // Temporary: will be replaced with auth later
      },
    });
  }

  async findAll() {
    return this.prisma.toDoList.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        tasks: {
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
    });
  }

  async findOne(id: number) {
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

  async update(id: number, updateToDoListDto: UpdateToDoListDto) {
    const list = await this.findOne(id);
    
    return this.prisma.toDoList.update({
      where: { id },
      data: {
        name: updateToDoListDto.name ?? list.name,
        type: updateToDoListDto.type ?? list.type,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    return this.prisma.toDoList.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async getDefaultLists() {
    return this.prisma.toDoList.findMany({
      where: {
        type: {
          in: [ListType.DAILY, ListType.WEEKLY, ListType.MONTHLY, ListType.YEARLY],
        },
        deletedAt: null,
      },
      include: {
        tasks: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        type: 'asc',
      },
    });
  }
}

