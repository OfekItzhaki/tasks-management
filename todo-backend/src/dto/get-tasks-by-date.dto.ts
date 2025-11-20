import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTasksByDateDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;
}


