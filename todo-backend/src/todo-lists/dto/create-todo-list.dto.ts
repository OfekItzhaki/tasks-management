import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ListType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export class CreateToDoListDto {
  @IsString()
  name: string;

  @IsEnum(ListType)
  @IsOptional()
  type?: ListType;
}
