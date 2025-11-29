import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
class UsersService {
    constructor(private prisma: PrismaService) {}

    private sanitizeUser(user: any) {
        if (!user) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, emailVerificationToken, ...rest } = user;
        return rest;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findFirst({
            where: {
                email,
                deletedAt: null,
            },
        });
    }

    async getAllUsers(requestingUserId: number) {
        const user = await this.getUser(requestingUserId, requestingUserId);
        return [user];
    }

    async getUser(id: number, requestingUserId: number) {
        if (id !== requestingUserId) {
            throw new ForbiddenException('You can only access your own profile');
        }

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
        const sanitized = {
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

        return this.sanitizeUser(sanitized);
    }

    async createUser(data: CreateUserDto) {
        const passwordHash = await bcrypt.hash(data.password, 10);
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        return this.prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                profilePicture: data.profilePicture,
                passwordHash,
                emailVerificationToken,
                emailVerificationSentAt: new Date(),
            },
        }).then((user) => this.sanitizeUser(user));
    }

    async verifyEmail(token: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                emailVerificationToken: token,
                deletedAt: null,
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        if (user.emailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationToken: null,
            },
        }).then((updatedUser) => this.sanitizeUser(updatedUser));
    }

    async resendVerificationEmail(email: string) {
        const user = await this.findByEmail(email);
        
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.emailVerified) {
            throw new BadRequestException('Email is already verified');
        }

        const emailVerificationToken = crypto.randomBytes(32).toString('hex');

        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken,
                emailVerificationSentAt: new Date(),
            },
        }).then((updatedUser) => this.sanitizeUser(updatedUser));
    }

    async updateUser(id: number, data: UpdateUserDto, requestingUserId: number) {
        await this.getUser(id, requestingUserId); // This will throw if user doesn't exist or unauthorized

        const updateData: any = {};
        if (data.email !== undefined) updateData.email = data.email;
        if (data.name !== undefined) updateData.name = data.name;
        if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;
        if (data.password !== undefined) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData,
        }).then((user) => this.sanitizeUser(user));
    }

    async deleteUser(id: number, requestingUserId: number) {
        await this.getUser(id, requestingUserId); // This will throw if user doesn't exist

        return this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        }).then((user) => this.sanitizeUser(user));
    }
}
export default UsersService;

