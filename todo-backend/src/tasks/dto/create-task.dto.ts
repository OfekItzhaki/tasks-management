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

export class CreateTaskDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  specificDayOfWeek?: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  @IsOptional()
  @IsInt()
  @Min(0)
  reminderDaysBefore?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
