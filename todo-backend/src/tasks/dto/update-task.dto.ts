import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  specificDayOfWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reminderDaysBefore?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
