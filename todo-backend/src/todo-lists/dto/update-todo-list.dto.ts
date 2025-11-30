import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ListType } from './create-todo-list.dto';

export class UpdateToDoListDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(ListType)
  @IsOptional()
  type?: ListType;
}
