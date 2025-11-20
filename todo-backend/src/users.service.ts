import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from './prisma.service';

@Injectable()
class UsersService {
    constructor(private prisma: PrismaService) {}

    async getAllUsers() {
        const users = await this.prisma.user.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                lists: {
                    where: {
                        deletedAt: null,
                    },
                },
                shares: {
                    include: {
                        toDoList: true,
                    },
                },
            },
        });

        // Filter out shares with deleted toDoList
        return users.map(user => ({
            ...user,
            shares: user.shares.filter(share => share.toDoList && share.toDoList.deletedAt === null),
        }));
    }

    async getUser(id: number) {
        const user = await this.prisma.user.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                lists: {
                    where: {
                        deletedAt: null,
                    },
                    include: {
                        tasks: {
                            where: {
                                deletedAt: null,
                            },
                        },
                    },
                },
                shares: {
                    include: {
                        toDoList: {
                            include: {
                                tasks: {
                                    where: {
                                        deletedAt: null,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // Filter out shares with deleted toDoList and their deleted tasks
        return {
            ...user,
            shares: user.shares
                .filter(share => share.toDoList && share.toDoList.deletedAt === null)
                .map(share => ({
                    ...share,
                    toDoList: {
                        ...share.toDoList,
                        tasks: share.toDoList.tasks.filter(task => task.deletedAt === null),
                    },
                })),
        };
    }

    async createUser(data: CreateUserDto) {
        return this.prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                profilePicture: data.profilePicture,
            },
        });
    }

    async updateUser(id: number, data: UpdateUserDto) {
        await this.getUser(id); // This will throw if user doesn't exist

        const updateData: any = {};
        if (data.email !== undefined) updateData.email = data.email;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;

        return this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteUser(id: number) {
        await this.getUser(id); // This will throw if user doesn't exist

        return this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }
}
export default UsersService;

