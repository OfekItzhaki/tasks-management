import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { GetTrashHandler } from './queries/handlers/get-trash.handler';
import { UpdateProfilePictureHandler } from './commands/handlers/update-profile-picture.handler';
import { CqrsModule } from '@nestjs/cqrs';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [CqrsModule, CloudinaryModule, PrismaModule],
  controllers: [MeController],
  providers: [GetTrashHandler, UpdateProfilePictureHandler],
})
export class MeModule {}
