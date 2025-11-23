import { IsInt } from 'class-validator';

export class ShareListDto {
  @IsInt()
  sharedWithId: number; // User ID to share with
}



