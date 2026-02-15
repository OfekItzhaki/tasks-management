import { Module } from '@nestjs/common';
import UsersController from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { TodoListsModule } from '../todo-lists/todo-lists.module';

@Module({
  imports: [PrismaModule, EmailModule, CloudinaryModule, TodoListsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
