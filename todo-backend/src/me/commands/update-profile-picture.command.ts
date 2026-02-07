import { ICommand } from '@nestjs/cqrs';

export class UpdateProfilePictureCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {}
}
